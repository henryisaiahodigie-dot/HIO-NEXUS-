"use server";

import { revalidatePath } from "next/cache";
import { requireProjectOwner, deductCredits } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCharacterSchema, type UpdateCharacterInput } from "@/lib/validations";
import { generateCharacters } from "@/lib/ai";
import type { ActionResult } from "./project.actions";

export async function generateCharactersAction(
  projectId: string
): Promise<ActionResult> {
  try {
    const user = await requireProjectOwner(projectId);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { sourceDocument: true, adaptation: true },
    });

    if (!project?.sourceDocument || !project.adaptation) {
      return { success: false, error: "Run story analysis and adaptation first." };
    }

    await deductCredits(user.id, 1, "Character bible generation", projectId);

    const generatedChars = await generateCharacters(
      project.sourceDocument.rawText,
      project.adaptation as Record<string, unknown>
    );

    await prisma.character.deleteMany({ where: { projectId } });

    type GeneratedChar = {
      name: string;
      age?: string;
      role?: string;
      biography?: string;
      personality?: string;
      motivation?: string;
      relationships?: string;
      visualDescription?: string;
      wardrobe?: string;
      voiceStyle?: string;
      emotionalArc?: string;
      continuityNotes?: string;
    };

    for (let idx = 0; idx < generatedChars.length; idx++) {
      const char = generatedChars[idx] as GeneratedChar;
      await prisma.character.create({
        data: {
          projectId,
          name: char.name,
          age: char.age ?? null,
          role:
            (char.role as
              | "PROTAGONIST"
              | "ANTAGONIST"
              | "SUPPORTING"
              | "NARRATOR"
              | "MINOR") ?? "SUPPORTING",
          biography: char.biography ?? null,
          personality: char.personality ?? null,
          motivation: char.motivation ?? null,
          relationships: char.relationships ?? null,
          visualDescription: char.visualDescription ?? null,
          wardrobe: char.wardrobe ?? null,
          voiceStyle: char.voiceStyle ?? null,
          emotionalArc: char.emotionalArc ?? null,
          continuityNotes: char.continuityNotes ?? null,
          orderIndex: idx,
        },
      });
    }

    revalidatePath(`/projects/${projectId}/characters`);
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate characters";
    return { success: false, error: message };
  }
}

export async function updateCharacterAction(
  characterId: string,
  projectId: string,
  data: UpdateCharacterInput
): Promise<ActionResult> {
  try {
    await requireProjectOwner(projectId);
    const validated = updateCharacterSchema.parse(data);

    await prisma.character.update({
      where: { id: characterId },
      data: validated,
    });

    revalidatePath(`/projects/${projectId}/characters`);
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update character";
    return { success: false, error: message };
  }
}

export async function deleteCharacterAction(
  characterId: string,
  projectId: string
): Promise<ActionResult> {
  try {
    await requireProjectOwner(projectId);
    await prisma.character.delete({ where: { id: characterId } });
    revalidatePath(`/projects/${projectId}/characters`);
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete character";
    return { success: false, error: message };
  }
}
