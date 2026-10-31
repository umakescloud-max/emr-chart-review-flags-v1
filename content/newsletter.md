# Every chart, not a sample

Most primary care groups review charts by sampling. One nurse opens a random handful of yesterday's visits, checks them against a paper checklist, logs problems in a spreadsheet and emails providers. Everything else goes to billing and pharmacy refills unchecked.

It keeps happening because the math doesn't work. In the fictional 8-provider group in our demo, about 104 visits close each day. At 3 to 4 minutes a chart, the nurse gets through about 35. That costs about 11 hours a week and still misses about 65% of charts. Billing estimates $8,500 a month in claims returned or downcoded for gaps found after submission. Corrections live in email, so nobody sees what's overdue or which gaps keep repeating.

## What the prototype does

We built a prototype that reviews every chart.

The Chart review screen lists every visit from the last three business days with provider, location, visit type, review status and any flag reason.

Opening a chart shows one history: visit summary, review findings, and every note and status change in order.

The Flagged charts screen holds the key case. Chart #5182 is a hypertension follow-up. The note says "Stop lisinopril due to persistent dry cough; start losartan 50 mg daily." The medication list still shows "Lisinopril 20 mg daily, 90-day refill queued." The chart is flagged the next morning with the reason "medication list conflicts with note", both lines side by side, the refill named, and a live countdown to the correction deadline.

The nurse attaches the provider's addendum and moves the chart to Correction sign-off. The proposed change sits there: remove lisinopril, add losartan, cancel the refill. Nothing in the chart changes and nothing goes to billing until the nurse clicks "Approve and release".

Four metrics come from the chart data: charts reviewed yesterday, flag rate, open flags past deadline, and average hours to resolve a flag.

## How a real version would be built

A nightly job reads closed encounters from the practice's existing EMR. Only the note sections each check needs go to Claude, under a signed BAA. Suggested flags come back to the review app. Corrections go back to the EMR, and charts go to the billing queue, only after staff approve them. Access is role-restricted, every view and action is audit-logged, and data is encrypted at rest and in transit.

## The honest part

This is a concept prototype with synthetic data. A production build runs on the client's own cloud (GCP), HIPAA-ready, and the client owns it.

Try the demo: https://umakescloud-max.github.io/emr-chart-review-flags-v1/

If your team fights this every week, book a free workflow audit at umakes.cloud or reply to umakescloud@gmail.com.
