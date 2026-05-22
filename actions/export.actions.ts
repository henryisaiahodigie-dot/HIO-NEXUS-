"use server";

import { revalidatePath } from "next/cache";
import { requireProjectOwner, deductCredits } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "./project.actions";
import type { ExportType } from "@prisma/client";

const RENDER_REQUIRED: ExportType[] = [
  "TRAILER",
  "PILOT_PREVIEW",
  "MP4_ANIMATIC",
  "FULL_MOVIE",
  "SOCIAL_CLIPS",
  "AUDIO_ONLY",
];

export async function requestExportAction(
  projectId: string,
  exportType: ExportType
): Promise<ActionResult<{ exportPackageId: string }>> {
  try {
    const user = await requireProjectOwner(projectId);

    const needsRenderProvider = RENDER_REQUIRED.includes(exportType);
    const hasProvider =
      !!process.env.KLING_API_KEY ||
      !!process.env.RUNWAY_API_KEY ||
      !!process.env.VEO_API_KEY;

    if (needsRenderProvider && !hasProvider) {
      return {
        success: false,
        error:
          "Final cinematic rendering requires a connected render provider. " +
          "Configure a video API key (KLING_API_KEY, RUNWAY_API_KEY, or VEO_API_KEY) to enable video exports.",
      };
    }

    await deductCredits(user.id, 1, `Export: ${exportType}`, projectId);

    const exportPackage = await prisma.exportPackage.create({
      data: {
        projectId,
        exportType,
        status: "PENDING",
        metadata: {
          requestedAt: new Date().toISOString(),
          requiresRenderProvider: needsRenderProvider,
        },
      },
    });

    await prisma.renderJob.create({
      data: {
        projectId,
        jobType: "EXPORT_PACKAGE",
        status: "QUEUED",
        progress: 0,
        creditsUsed: 1,
        metadata: { exportPackageId: exportPackage.id, exportType },
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "EXPORTING" },
    });

    revalidatePath(`/projects/${projectId}/export`);
    return { success: true, data: { exportPackageId: exportPackage.id } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to request export";
    return { success: false, error: message };
  }
}
