"use server";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import type {
  CreateFeedbackParams,
  CreateInterviewParams,
  GetFeedbackByInterviewIdParams,
  GetLatestInterviewsParams,
  Interview,
  Feedback,
} from "@/types";

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map((sentence: { role: string; content: string }) =>
        `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { text } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `
        You are an AI interviewer analyzing a mock interview. Evaluate the candidate and return ONLY a JSON object with no markdown, no backticks, just raw JSON.

        Transcript:
        ${formattedTranscript}

        Return this exact JSON structure:
        {
          "totalScore": 75,
          "categoryScores": [
            { "name": "Communication Skills", "score": 80, "comment": "..." },
            { "name": "Technical Knowledge", "score": 70, "comment": "..." },
            { "name": "Problem Solving", "score": 75, "comment": "..." },
            { "name": "Cultural Fit", "score": 80, "comment": "..." },
            { "name": "Confidence and Clarity", "score": 70, "comment": "..." }
          ],
          "strengths": ["strength 1", "strength 2"],
          "areasForImprovement": ["area 1", "area 2"],
          "finalAssessment": "Overall assessment here."
        }
      `,
    });

    const cleaned = text.replace(/```json|```/g, "").trim();
    const object = JSON.parse(cleaned);

    const feedback = {
      interviewId,
      userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;
    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);
    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();
  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function createInterview(params: CreateInterviewParams) {
  const { userId, role, level, techstack, type, amount } = params;

  try {
    console.log("createInterview called with:", params);

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-interview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, level, techstack, type, amount }),
    });

    console.log("API response status:", response.status);

    const json = await response.json();
    console.log("API response json:", json);

    const { questions } = json;
    console.log("Questions generated:", questions);

    const interview = {
      userId,
      role,
      level,
      techstack: techstack.split(",").map((t: string) => t.trim()),
      type,
      questions,
      finalized: true,
      createdAt: new Date().toISOString(),
    };

    const interviewRef = db.collection("interviews").doc();
    await interviewRef.set(interview);

    return { success: true, interviewId: interviewRef.id };
  } catch (error) {
    console.error("createInterview error:", error);
    return { success: false };
  }
}