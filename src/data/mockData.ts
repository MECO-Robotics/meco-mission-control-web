import type { PortalCard, SubsystemCard, WorkflowLane } from "../types";

const portals: PortalCard[] = [
  {
    title: "Student action board",
    topline: "Student surface",
    metric: "12 active tasks",
    description:
      "Quick access to assigned work, blockers, meeting RSVP, and work-log status before a task can close.",
    roles: ["students"],
    items: [
      "Assigned tasks with dependency order and blocker signals",
      "Meeting RSVP and attendance status",
      "Work-log reminder feed before completion is allowed",
    ],
  },
  {
    title: "Mentor QA review desk",
    topline: "Mentor surface",
    metric: "5 waiting for QA",
    description:
      "Review browser-friendly evidence, mark pass/fail outcomes, and keep mentor-backed approval explicit.",
    roles: ["mentors"],
    items: [
      "Task and fabrication review queue",
      "Minor-fix versus iteration-worthy failure classification",
      "Documentation evidence and notebook links",
    ],
  },
  {
    title: "Admin operations console",
    topline: "Admin surface",
    metric: "88% RSVP coverage",
    description:
      "Coordinate meetings, purchasing, attendance totals, and planning metrics across the whole team.",
    roles: ["admins"],
    items: [
      "Attendance rollups and man-hours",
      "Purchase approval and delivery tracking",
      "Cross-subsystem reporting and staffing trends",
    ],
  },
  {
    title: "Subsystem leadership board",
    topline: "Shared view",
    metric: "3 subsystems",
    description:
      "Standup-ready browser view for responsible engineers and mentors to track risk, blockers, and next work.",
    roles: ["students", "mentors", "admins"],
    items: [
      "Progress snapshots by subsystem",
      "Escalation notes for schedule, shipping, and QA delay",
      "Next executable tasks after dependency checks",
    ],
  },
];

const workflowLanes: WorkflowLane[] = [
  {
    title: "Task workflow",
    metric: "4 core states",
    summary:
      "Not started, in progress, waiting for QA, and complete, with completion blocked until logs and mentor QA exist.",
    tags: ["Dependencies", "Blockers", "Mentor ownership", "Completion gate"],
  },
  {
    title: "Manufacturing queue",
    metric: "3 fabrication paths",
    summary:
      "Unified browser view for 3D printing, CNC, and fabrication items with due dates, material, batch grouping, and QA.",
    tags: ["Batch grouping", "Mentor review", "Fabrication QA", "Due dates"],
  },
  {
    title: "Purchase workflow",
    metric: "5 statuses",
    summary:
      "Requested through delivered, with mentor approval, estimated and final cost, and links back to subsystem work.",
    tags: ["Approval", "Lead time", "Cost visibility", "Vendor links"],
  },
  {
    title: "Planning analytics",
    metric: "10+ metrics",
    summary:
      "Time estimation, QA turnaround, blocker frequency, manufacturing turnaround, and attendance rollups for future planning.",
    tags: ["Estimation", "QA turnaround", "Iteration rate", "Attendance"],
  },
];

const subsystems: SubsystemCard[] = [
  { name: "Drivetrain", lead: "Ava Chen", mentor: "Jordan Lee", progress: 82 },
  { name: "Manipulator", lead: "Lucas Brooks", mentor: "Riley Kim", progress: 58 },
  { name: "Controls", lead: "Ethan Hall", mentor: "Riley Kim", progress: 43 },
];

export const operationsSnapshot = {
  summaryCards: [
    {
      label: "Tasks waiting for QA",
      value: "5",
      note: "Browser review queue for mentors and design review.",
    },
    {
      label: "Tracked hours this week",
      value: "47.5h",
      note: "Work logs stay mandatory to keep future estimates grounded.",
    },
    {
      label: "Manufacturing items open",
      value: "8",
      note: "CNC, prints, and fabrication stay visible in one board.",
    },
    {
      label: "Purchase requests open",
      value: "3",
      note: "Mentor approval and delivery dates stay linked to task flow.",
    },
  ],
  topSignals: [
    { label: "Mentor QA passes", value: "11", note: "Final approvals captured" },
    { label: "Escalations", value: "2", note: "High-visibility blockers" },
    { label: "Meetings this week", value: "3", note: "RSVP and sign-in tracked" },
    { label: "Iteration flags", value: "1", note: "Design rework surfaced early" },
  ],
  portals,
  workflowLanes,
  subsystems,
  escalations: [
    {
      title: "Manipulator redesign is waiting on CNC batch B-17",
      detail:
        "Browser dashboard flags the downstream task impact and keeps the blocker visible for mentors.",
    },
    {
      title: "Controls review still depends on final drive calibration evidence",
      detail:
        "The QA desk keeps documentation requirements visible before a mentor can finalize approval.",
    },
  ],
  metrics: {
    completionRate: 0.76,
  },
  metricsTable: [
    { label: "Average QA turnaround", value: "1.4 days" },
    { label: "Average task actual vs estimate", value: "+12%" },
    { label: "Manufacturing turnaround", value: "3.2 days" },
    { label: "Purchase lead time", value: "5.6 days" },
    { label: "Iteration-worthy failures", value: "1 this sprint" },
    { label: "Attendance by active members", value: "88%" },
  ],
  deploymentCards: [
    {
      repo: "MECO-Robotics/PM-mobile-app",
      title: "Mobile workflow app",
      description:
        "Expo/React Native client for in-shop updates, quick task movement, sign-ins, and portable QA status.",
      points: [
        "Best for phones and tablets",
        "Supports fast task and meeting interactions",
        "Consumes the shared platform API",
      ],
    },
    {
      repo: "MECO-Robotics/PM-web-app",
      title: "Browser dashboard",
      description:
        "React/Vite web app for larger-screen dashboards, review surfaces, and planning views.",
      points: [
        "Served by nginx on the shared VPS",
        "Great for mentor and admin workflows",
        "Can move to live API calls without changing origin",
      ],
    },
    {
      repo: "MECO-Robotics/PM-server",
      title: "Shared backend",
      description:
        "Fastify API plus Postgres on the same Hetzner VPS, with business rules and reporting data model ownership.",
      points: [
        "Fastify + Prisma starter",
        "Owns completion-gating logic",
        "Backs both mobile and browser clients",
      ],
    },
  ],
};
