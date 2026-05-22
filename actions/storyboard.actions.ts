"use server";

import { revalidatePath } from "next/cache";
import { requireProjectOwner, deductCredits } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateStoryboardPrompts } from "@/lib/ai";
import type { ActionResult } from "./project.actions";

export async function generateStoryboardAction(
  projectId: string,
  sceneId?: string
): Promise<ActionResult> {
  try {
    const user = await requireProjectOwner(projectId);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        scenes: { orderBy: { sceneNumber: "asc" } },
        adaptation: { select: { visualStyleGuide: true } },
      },
    });

    if (!project?.scenes.length) {
      return { success: false, error: "Generate scenes first." };
    }

    await deductCredits(user.id, 1, "Storyboard generation", projectId);

    const scenesToProcess = sceneId
      ? project.scenes.filter((s) => s.id === sceneId)
      : project.scenes;

    const visualStyleGuide = project.adaptation?.visualStyleGuide ?? "";

    for (const scene of scenesToProcess) {
      const shots = await generateStoryboardPrompts(
        scene,
        visualStyleGuide,
        project.movieStyle ?? "CINEMATIC_DRAMA"
      );

      await prisma.shot.deleteMany({ where: { sceneId: scene.id } });

      type GeneratedShot = {
        shotNumber: number;
        description?: string;
        cameraMovement?: string;
        framing?: string;
        lighting?: string;
        composition?: string;
        transition?: string;
        generationPrompt?: string;
        continuityRef?: string;
        estimatedSeconds?: number;
      };

      for (const shot of shots as GeneratedShot[]) {
        const createdShot = await prisma.shot.create({
          data: {
            sceneId: scene.id,
            shotNumber: shot.shotNumber,
            description: shot.description ?? null,
            cameraMovement: shot.cameraMovement ?? null,
            framing: shot.framing ?? null,
            lighting: shot.lighting ?? null,
            composition: shot.composition ?? null,
            transition: shot.transition ?? null,
            generationPrompt: shot.generationPrompt ?? null,
            continuityRef: shot.continuityRef ?? null,
            estimatedSeconds: shot.estimatedSeconds ?? null,
            status: "PENDING",
          },
        });

        await prisma.storyboardFrame.create({
          data: {
            sceneId: scene.id,
            shotId: createdShot.id,
            frameNumber: shot.shotNumber,
            imagePrompt: shot.generationPrompt ?? null,
            caption: shot.description ?? null,
          },
        });
      }
    }

    revalidatePath(`/projects/${projectId}/storyboard`);
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate storyboard";
    return { success: false, error: message };
  }
}

export async function approveShotAction(
  shotId: string,
  projectId: string
): Promise<ActionResult> {
  try {
    await requireProjectOwner(projectId);
    await prisma.shot.update({
      where: { id: shotId },
      data: { status: "APPROVED" },
    });
    revalidatePath(`/projects/${projectId}/storyboard`);
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to approve shot";
    return { success: false, error: message };
  }
}
