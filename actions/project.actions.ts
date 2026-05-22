"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentDbUser, requireProjectOwner, deductCredits } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProjectSchema, type CreateProjectInput } from "@/lib/validations";
import { wordCount } from "@/lib/utils";
import { PLAN_MAX_PROJECTS } from "@/types";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createProjectAction(
  input: CreateProjectInput
): Promise<ActionResult<{ projectId: string }>> {
  try {
    const user = await getCurrentDbUser();
    const validated = createProjectSchema.parse(input);

    const projectCount = await prisma.project.count({
      where: { userId: user.id },
    });
    const maxProjects = PLAN_MAX_PROJECTS[user.plan];

    if (projectCount >= maxProjects) {
      return {
        success: false,
        error: `Your ${user.plan} plan allows up to ${maxProjects} project(s). Upgrade to create more.`,
      };
    }

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        title: validated.title,
        description: validated.description ?? null,
        mode: validated.mode,
        movieStyle: validated.movieStyle ?? null,
        targetLength: validated.targetLength ?? null,
        status: "DRAFT",
        sourceDocument: {
          create: {
            rawText: validated.rawText,
            fileType: validated.fileType,
            wordCount: wordCount(validated.rawText),
          },
        },
      },
    });

    revalidatePath("/dashboard");
    return { success: true, data: { projectId: project.id } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create project";
    return { success: false, error: message };
  }
}

export async function deleteProjectAction(
  projectId: string
): Promise<ActionResult> {
  try {
    await requireProjectOwner(projectId);
    await prisma.project.delete({ where: { id: projectId } });
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete project";
    return { success: false, error: message };
  }
}

export async function updateProjectAction(
  projectId: string,
  data: {
    title?: string;
    description?: string;
    movieStyle?: string;
    targetLength?: string;
  }
): Promise<ActionResult> {
  try {
    await requireProjectOwner(projectId);
    await prisma.project.update({
      where: { id: projectId },
      data,
    });
    revalidatePath(`/projects/${projectId}`);
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update project";
    return { success: false, error: message };
  }
}

export async function runFullPipelineAction(
  projectId: string
): Promise<ActionResult<{ projectId: string }>> {
  try {
    const user = await requireProjectOwner(projectId);

    // Check user has at least 5 credits for full pipeline
    if (user.credits < 5) {
      return {
        success: false,
        error: "Full pipeline requires 5 credits. You don't have enough credits.",
      };
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { sourceDocument: true, rightsDeclaration: true },
    });

    if (!project?.sourceDocument) {
      return { success: false, error: "No source document found." };
    }

    if (!project.rightsDeclaration) {
      return { success: false, error: "Complete rights declaration first." };
    }

    if (
      project.rightsDeclaration.classification === "BLOCKED" ||
      project.rightsDeclaration.classification === "RISKY"
    ) {
      return {
        success: false,
        error: "Project rights classification prevents pipeline execution.",
      };
    }

    // Trigger analysis — redirect to project page. The pipeline
    // continues step-by-step via the UI.
    revalidatePath(`/projects/${projectId}`);
    return { success: true, data: { projectId } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run pipeline";
    return { success: false, error: message };
  }
}
