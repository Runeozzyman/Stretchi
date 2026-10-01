//Test that agent doesn't ask questions that it already has an answer for, and asks irritability once, last

import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";

function asksAbout(message: string, topic: RegExp){
    return message
        .split(/(?<=[.?!])\s+/)
        .some((sentence) => sentence.includes("?") && topic.test(sentence));
}

const irritability = /irritab|mild|moderate/i;
const equipment = /equipment|band|dumbbell|foam roller/i;
const time = /\btime\b|minutes/i;

export default defineEval({
    async test(t){

        const first = await t.send("I have pain in my lower back on the right side, I've had it for 2 days.");
        t.succeeded();
        first.loadedSkill("intake");
        t.judge("The response asks the user for any recent changes in health or injuries.",
            {on: first.message},
        ).atLeast(0.8);

        const second = await first.session.send("No recent injuries or health changes");
        second.loadedSkill("check-redflags");
        t.judge("The response does not ask for the location of pain, or how long they've been experiencing it.",
            {on: second.message},
        ).atLeast(0.8);
        t.check(
            second.message ?? "",
            satisfies(
                (message: string) => asksAbout(message, equipment) && !asksAbout(message, irritability),
                "second reply asks about equipment, not irritability",
            ),
        );

        const third = await second.session.send("No equipment");
        t.check(
            third.message ?? "",
            satisfies(
                (message: string) => asksAbout(message, time) && !asksAbout(message, irritability),
                "third reply asks about available time, not irritability",
            ),
        );

        const fourth = await third.session.send("I have 10 minutes");
        t.check(
            fourth.message ?? "",
            satisfies(
                (message: string) => asksAbout(message, irritability),
                "fourth reply asks about irritability",
            ),
        );

        const fifth = await fourth.session.send("It is mild");
        fifth.loadedSkill("prescribe-routine");
        t.check(
            fifth.message ?? "",
            satisfies(
                (message: string) => !asksAbout(message, irritability),
                "irritability is not asked again",
            ),
        );
    },
});
