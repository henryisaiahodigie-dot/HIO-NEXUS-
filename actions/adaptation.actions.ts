"use server";

import { revalidatePath } from "next/cache";
import { requireProjectOwner, deductCredits } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAdaptationSchema, type UpdateAdaptationInput } from "@/lib/validations";
import { generateAdaptation } from "@/lib/ai";
import type { ActionResult } from "./project.actions";

export async function generateAdaptationAction(
  projectId: string
): Promise<ActionResult> {
  try {
    const user = await requireProjectOwner(projectId);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { sourceDocument: true, adaptation: true },
    });

    if (!project?.sourceDocument) {
      return { success: false, error: "No source document found." };
    }

    if (!project.adaptation) {
      return { success: false, error: "Run story analysis first." };
    }

    await deductCredits(user.id, 1, "Adaptation generation", projectId);

    const result = await generateAdaptation(
      project.sourceDocument.rawText,
      project.adaptation as Record<string, unknown>,
      project.movieStyle ?? "CINEMATIC_DRAMA",
      project.targetLength ?? "PILOT_10MIN",
      project.adaptation.adaptationType ?? "FAITHFUL"
    );

    await prisma.adaptation.update({
      where: { projectId },
      data: {
        treatment: result.treatment ?? null,
        beatSheet: result.beatSheet ?? null,
        actStructure: result.actStructure ?? null,
        narrationPlan: result.narrationPlan ?? null,
        dialoguePlan: result.dialoguePlan ?? null,
        visualStyleGuide: result.visualStyleGuide ?? null,
        emotionalToneGuide: result.emotionalToneGuide ?? null,
      },
    });

    revalidatePath(`/projects/${projectId}/adaptation`);
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate adaptation";
    return { success: false, error: message };
  }
}

export async function updateAdaptationAction(
  projectId: string,
  data: UpdateAdaptationInput
): Promise<ActionResult> {
  try {
    await requireProjectOwner(projectId);
    const validated = updateAdaptationSchema.parse(data);

    await prisma.adaptation.upsert({
      where: { projectId },
      update: validated,
      create: { projectId, ...validated },
    });

    revalidatePath(`/projects/${projectId}/adaptation`);
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update adaptation";
    return { success: false, error: message };
  }
}
