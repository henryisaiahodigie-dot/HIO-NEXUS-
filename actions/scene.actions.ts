"use server";

import { revalidatePath } from "next/cache";
import { requireProjectOwner, deductCredits } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSceneSchema, type UpdateSceneInput } from "@/lib/validations";
import { generateScenes } from "@/lib/ai";
import type { ActionResult } from "./project.actions";

export async function generateScenesAction(
  projectId: string
): Promise<ActionResult> {
  try {
    const user = await requireProjectOwner(projectId);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        adaptation: true,
        characters: { select: { name: true, role: true } },
      },
    });

    if (!project?.adaptation) {
      return { success: false, error: "Run adaptation generation first." };
    }

    await deductCredits(user.id, 1, "Scene generation", projectId);

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "STORYBOARDING" },
    });

    const generatedScenes = await generateScenes(
      project.adaptation as Record<string, unknown>,
      project.characters,
      project.movieStyle ?? "CINEMATIC_DRAMA",
      project.targetLength ?? "PILOT_10MIN"
    );

    await prisma.scene.deleteMany({ where: { projectId } });

    type GeneratedScene = {
      sceneNumber: number;
      title?: string;
      location?: string;
      timeOfDay?: string;
      actionSummary?: string;
      dialogue?: string;
      narration?: string;
      cameraDirection?: string;
      mood?: string;
      musicCue?: string;
      vfxRequirements?: string;
      continuityNotes?: string;
      estimatedDuration?: number;
    };

    for (const scene of generatedScenes as GeneratedScene[]) {
      await prisma.scene.create({
        data: {
          projectId,
          sceneNumber: scene.sceneNumber,
          title: scene.title ?? null,
          location: scene.location ?? null,
          timeOfDay: scene.timeOfDay ?? null,
          actionSummary: scene.actionSummary ?? null,
          dialogue: scene.dialogue ?? null,
          narration: scene.narration ?? null,
          cameraDirection: scene.cameraDirection ?? null,
          mood: scene.mood ?? null,
          musicCue: scene.musicCue ?? null,
          vfxRequirements: scene.vfxRequirements ?? null,
          continuityNotes: scene.continuityNotes ?? null,
          estimatedDuration: scene.estimatedDuration ?? null,
          status: "DRAFT",
        },
      });
    }

    revalidatePath(`/projects/${projectId}/scenes`);
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate scenes";
    return { success: false, error: message };
  }
}

export async function updateSceneAction(
  sceneId: string,
  projectId: string,
  data: UpdateSceneInput
): Promise<ActionResult> {
  try {
    await requireProjectOwner(projectId);
    const validated = updateSceneSchema.parse(data);

    await prisma.scene.update({ where: { id: sceneId }, data: validated });

    revalidatePath(`/projects/${projectId}/scenes`);
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update scene";
    return { success: false, error: message };
  }
}

export async function approveSceneAction(
  sceneId: string,
  projectId: string
): Promise<ActionResult> {
  try {
    await requireProjectOwner(projectId);
    await prisma.scene.update({
      where: { id: sceneId },
      data: { status: "APPROVED" },
    });
    revalidatePath(`/projects/${projectId}/scenes`);
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to approve scene";
    return { success: false, error: message };
  }
}
