import { useState } from "react";
import { OneClickLogin, StoryPanel, useActivity } from "@kit";
import { PRACTICE } from "../seed";
import { LOGIN_KEY, ScreenChrome, isLoggedIn } from "./chrome";

const PAIN_POINTS = [
  "Only about a third of charts get reviewed each day; the rest go to billing unchecked",
  "Medication list conflicts reach the pharmacy before anyone notices them",
  "Corrections are tracked in a spreadsheet and by email, so nobody can see what's overdue",
  "Nobody records which flag reasons keep coming back, so the same documentation gaps repeat every week",
];

const BEFORE =
  "7:00am: Priya opens the EMR and her spreadsheet and starts pulling 35 random charts from yesterday's 104 visits. By 9:15am she has found 3 unsigned notes and emailed the providers. Chart #5182 (T. Nguyen, hypertension follow-up with Dr. Elena Brooks) isn't in her sample. The note says lisinopril was stopped because of a dry cough and losartan was started, but the active medication list still shows lisinopril 20 mg, and a 90-day refill is queued to go to the pharmacy tomorrow. The claim goes out with a chart that contradicts itself.";

const AFTER =
  "7:00am: Priya opens the chart review screen. All 104 of yesterday's charts already have a first-pass review, and 9 are flagged. Chart #5182 is at the top of Flagged charts: 'medication list conflicts with note', 2 business days left before the correction deadline, with the queued refill named. Priya attaches Dr. Brooks's addendum confirming the switch, moves the chart to correction sign-off, checks the proposed medication list change, and approves it herself, which removes the queued refill and releases the chart to billing. Nothing changed without her click. She's on the next flag by 7:20am.";

const DAY_IN_THE_LIFE =
  "Priya starts at 7:00am with yesterday's 104 closed visits. She has time to open about 35 of them, picked at random, and checks each for an unsigned note, a diagnosis that the note doesn't support, missing vitals, and a medication list that doesn't match what the provider wrote. Each chart takes 3-4 minutes. By 9:15am she has found 3 problems, emailed 3 providers, and written each one into a shared spreadsheet. The other 69 charts go to billing unreviewed, and chart #5182 is one of them.";

const COST_OF_PAIN =
  "Priya spends about 11 hours per week on manual sampling and still misses about 65% of charts. The billing team estimates $8,500 per month in claims returned or downcoded because of documentation gaps found after submission.";

export default function Story() {
  const { logAction } = useActivity();
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());

  function handleLogin() {
    try {
      window.localStorage.setItem(LOGIN_KEY, "1");
    } catch {
      // Storage unavailable: continue into the prototype for this session.
    }
    setLoggedIn(true);
  }

  function handleStartTour() {
    logAction("Started the guided tour");
    const replay = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent === "Replay tour"
    );
    replay?.click();
  }

  if (!loggedIn) {
    return (
      <OneClickLogin
        personaName={PRACTICE.personaName}
        personaRole={PRACTICE.personaRole}
        practiceName={PRACTICE.name}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <ScreenChrome>
      <StoryPanel
        practiceName={PRACTICE.name}
        practiceType={PRACTICE.type}
        personaName={PRACTICE.personaName}
        dayInTheLife={DAY_IN_THE_LIFE}
        painPoints={PAIN_POINTS}
        costOfPain={COST_OF_PAIN}
        before={BEFORE}
        after={AFTER}
        onStartTour={handleStartTour}
      />
    </ScreenChrome>
  );
}
