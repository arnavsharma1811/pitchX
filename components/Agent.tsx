"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createInterview, createFeedback } from "@/lib/actions/general.action";
import type { AgentProps } from "@/types";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

const GENERATE_STEPS = [
  "What role are you preparing for?",
  "What level are you targeting? Junior, Mid, or Senior?",
  "What is your tech stack? For example, React, Node.js, MongoDB.",
  "What type of interview do you want? Technical, Behavioral, or Mixed?",
  "How many questions do you want? Say a number between 3 and 10.",
];

const Agent = ({
  userName,
  userId,
  type,
  interviewId,
  questions,
  feedbackId,
  profileImage,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [generateStep, setGenerateStep] = useState(0);
  const [interviewDetails, setInterviewDetails] = useState({
    role: "",
    level: "",
    techstack: "",
    type: "",
    amount: 5,
  });

  const recognitionRef = useRef<any>(null);
  const generateStepRef = useRef(0);
  const isListeningRef = useRef(false);
  const currentQuestionIndexRef = useRef(0);
  const interviewDetailsRef = useRef({
    role: "",
    level: "",
    techstack: "",
    type: "",
    amount: 5,
  });

  const lastMessage = messages[messages.length - 1]?.content || "";

  const speak = (text: string, onDone?: () => void) => {
    window.speechSynthesis.cancel();
    recognitionRef.current?.stop();
    isListeningRef.current = false;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onDone) onDone();
      else setTimeout(() => startListening(), 1000);
    };
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (isListeningRef.current) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    isListeningRef.current = true;

    recognition.onresult = (event: any) => {
      isListeningRef.current = false;
      const answer = event.results[0][0].transcript;
      setMessages((prev) => [...prev, { role: "user", content: answer }]);

      if (type === "generate") {
        handleGenerateStep(answer);
      } else {
        handleInterviewStep(answer);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      isListeningRef.current = false;
      if (event.error === "no-speech") {
        setTimeout(() => startListening(), 1000);
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
    };

    recognition.start();
  };

  const handleGenerateStep = (answer: string) => {
    const step = generateStepRef.current;
    const updatedDetails = { ...interviewDetailsRef.current };

    if (step === 0) updatedDetails.role = answer;
    else if (step === 1) updatedDetails.level = answer;
    else if (step === 2) updatedDetails.techstack = answer;
    else if (step === 3) updatedDetails.type = answer;
    else if (step === 4) {
      const num = parseInt(answer.match(/\d+/)?.[0] || "5");
      updatedDetails.amount = Math.min(Math.max(num, 3), 10);
    }

    interviewDetailsRef.current = updatedDetails;
    setInterviewDetails(updatedDetails);

    const nextStep = step + 1;
    generateStepRef.current = nextStep;

    if (nextStep < GENERATE_STEPS.length) {
      setGenerateStep(nextStep);
      const nextQuestion = GENERATE_STEPS[nextStep];
      setMessages((prev) => [...prev, { role: "assistant", content: nextQuestion }]);
      speak(nextQuestion);
    } else {
      const confirmMsg = `Got it! Generating your ${updatedDetails.level} ${updatedDetails.role} interview now. Please wait.`;
      setMessages((prev) => [...prev, { role: "assistant", content: confirmMsg }]);
      speak(confirmMsg, async () => {
        try {
          console.log("Calling generate-interview with:", updatedDetails);
          const result = await createInterview({
            userId: userId!,
            role: updatedDetails.role,
            level: updatedDetails.level,
            techstack: updatedDetails.techstack,
            type: updatedDetails.type,
            amount: updatedDetails.amount,
          });

          console.log("createInterview result:", result);

          if (result.success && result.interviewId) {
            setCallStatus(CallStatus.FINISHED);
            router.push(`/interview/${result.interviewId}`);
          } else {
            const errorMsg = "Sorry, something went wrong. Please try again.";
            setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
            speak(errorMsg);
          }
        } catch (err) {
          console.error("Error creating interview:", err);
        }
      });
    }
  };

  const handleInterviewStep = (answer: string) => {
    if (questions && currentQuestionIndexRef.current < questions.length - 1) {
      const nextIndex = currentQuestionIndexRef.current + 1;
      currentQuestionIndexRef.current = nextIndex;
      setCurrentQuestionIndex(nextIndex);
      const nextQuestion = questions[nextIndex];
      setMessages((prev) => [...prev, { role: "assistant", content: nextQuestion }]);
      speak(nextQuestion);
    } else {
      setCallStatus(CallStatus.FINISHED);
    }
  };

  const handleStart = async () => {
    generateStepRef.current = 0;
    isListeningRef.current = false;
    currentQuestionIndexRef.current = 0;
    interviewDetailsRef.current = {
      role: "",
      level: "",
      techstack: "",
      type: "",
      amount: 5,
    };
    setGenerateStep(0);
    setInterviewDetails({
      role: "",
      level: "",
      techstack: "",
      type: "",
      amount: 5,
    });
    setMessages([]);
    setCurrentQuestionIndex(0);
    setCallStatus(CallStatus.ACTIVE);

    if (type === "generate") {
      const intro = GENERATE_STEPS[0];
      setMessages([{ role: "assistant", content: intro }]);
      speak(intro);
    } else {
      if (!questions || questions.length === 0) return;
      const firstQuestion = questions[0];
      setMessages([{ role: "assistant", content: firstQuestion }]);
      speak(firstQuestion);
    }
  };

  const handleEnd = () => {
    window.speechSynthesis.cancel();
    recognitionRef.current?.stop();
    isListeningRef.current = false;
    setCallStatus(CallStatus.FINISHED);
  };

  useEffect(() => {
    if (
      callStatus === CallStatus.FINISHED &&
      type === "interview" &&
      messages.length > 0
    ) {
      const generateFeedback = async () => {
        await createFeedback({
          interviewId: interviewId!,
          userId: userId!,
          transcript: messages,
          feedbackId,
        });
        router.push(`/interview/${interviewId}/feedback`);
      };
      generateFeedback();
    }
  }, [callStatus]);

  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="ai"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        <div className="card-border">
          <div className="card-content">
            <Image
              src={profileImage || "/user-avatar.png"}
              alt="user avatar"
              width={540}
              height={540}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== CallStatus.ACTIVE ? (
          <button className="relative btn-call" onClick={handleStart}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== CallStatus.CONNECTING && "hidden"
              )}
            />
            <span>
              {callStatus === CallStatus.INACTIVE ||
              callStatus === CallStatus.FINISHED
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleEnd}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;