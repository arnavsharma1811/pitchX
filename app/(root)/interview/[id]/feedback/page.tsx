import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getFeedbackByInterviewId, getInterviewById } from "@/lib/actions/general.action";

const FeedbackPage = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  const [interview, feedback] = await Promise.all([
    getInterviewById(id),
    getFeedbackByInterviewId({ interviewId: id, userId: user?.id! }),
  ]);

  if (!interview) redirect("/");
  if (!feedback) redirect(`/interview/${id}`);

  return (
    <section className="section-feedback">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the <span className="text-primary-200 capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      <div className="flex flex-row justify-center">
        <div className="flex flex-row gap-5">
          {/* Overall Score */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" alt="star" width={22} height={22} />
            <p>
              Overall Score:{" "}
              <span className="text-primary-200 font-bold">{feedback.totalScore}/100</span>
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/calendar.svg" alt="calendar" width={22} height={22} />
            <p>{new Date(feedback.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Final Assessment */}
      <div className="flex flex-col gap-4">
        <h2>Final Assessment</h2>
        <p className="text-lg">{feedback.finalAssessment}</p>
      </div>

      {/* Category Scores */}
      <div className="flex flex-col gap-4">
        <h2>Interview Breakdown</h2>
        <div className="flex flex-col gap-4">
          {feedback.categoryScores?.map((category: any, index: number) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex flex-row justify-between">
                <h3 className="font-semibold">{category.name}</h3>
                <span className="text-primary-200 font-bold">{category.score}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-200 h-2 rounded-full"
                  style={{ width: `${category.score}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">{category.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div className="flex flex-col gap-4">
        <h2>Strengths</h2>
        <ul className="flex flex-col gap-2">
          {feedback.strengths?.map((strength: string, index: number) => (
            <li key={index} className="flex flex-row gap-2 items-start">
              <Image src="/star.svg" alt="check" width={20} height={20} className="mt-1" />
              <p>{strength}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Areas for Improvement */}
      <div className="flex flex-col gap-4">
        <h2>Areas for Improvement</h2>
        <ul className="flex flex-col gap-2">
          {feedback.areasForImprovement?.map((area: string, index: number) => (
            <li key={index} className="flex flex-row gap-2 items-start">
              <Image src="/tech.svg" alt="improve" width={20} height={20} className="mt-1" />
              <p>{area}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Buttons */}
      <div className="flex flex-row gap-4 justify-center">
        <Link href="/" className="btn-secondary">
          Back to Dashboard
        </Link>
        <Link href={`/interview/${id}`} className="btn-primary">
          Retake Interview
        </Link>
      </div>
    </section>
  );
};

export default FeedbackPage;