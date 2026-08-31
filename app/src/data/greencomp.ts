// Bundled, versioned copy of reference/greencomp.json (the official GreenComp
// competence names and working descriptors). Embedding it as a TS module
// means it ships inside the built JS bundle — no runtime fetch is needed to
// read it, matching the "no runtime network request" requirement.

export interface Competence {
  id: string;
  name: string;
  working_descriptor: string;
}

export interface GreenCompArea {
  id: string;
  name: string;
  competences: Competence[];
}

export interface GreenCompFramework {
  framework: string;
  version: string;
  non_prescriptive: boolean;
  areas: GreenCompArea[];
  scoring: Record<"0" | "1" | "2" | "3", string>;
}

export const GREENCOMP: GreenCompFramework = {
  framework: "GreenComp",
  version: "2022",
  non_prescriptive: true,
  areas: [
    {
      id: "1",
      name: "Embodying sustainability values",
      competences: [
        {
          id: "1.1",
          name: "Valuing sustainability",
          working_descriptor:
            "Reflect on sustainability values and how values influence choices and priorities."
        },
        {
          id: "1.2",
          name: "Supporting fairness",
          working_descriptor:
            "Consider equity and justice within and between generations, places and groups."
        },
        {
          id: "1.3",
          name: "Promoting nature",
          working_descriptor:
            "Recognise humans as part of nature and support the health and restoration of ecosystems."
        }
      ]
    },
    {
      id: "2",
      name: "Embracing complexity in sustainability",
      competences: [
        {
          id: "2.1",
          name: "Systems thinking",
          working_descriptor:
            "Explore relationships, feedback, context and consequences within a sustainability system."
        },
        {
          id: "2.2",
          name: "Critical thinking",
          working_descriptor:
            "Evaluate information, arguments, assumptions, sources and perspectives."
        },
        {
          id: "2.3",
          name: "Problem framing",
          working_descriptor:
            "Formulate, scope and revise a sustainability challenge and possible approaches."
        }
      ]
    },
    {
      id: "3",
      name: "Envisioning sustainable futures",
      competences: [
        {
          id: "3.1",
          name: "Futures literacy",
          working_descriptor:
            "Imagine and examine alternative, plausible and preferred futures."
        },
        {
          id: "3.2",
          name: "Adaptability",
          working_descriptor:
            "Respond constructively to uncertainty, change, feedback and limits."
        },
        {
          id: "3.3",
          name: "Exploratory thinking",
          working_descriptor:
            "Explore, connect and compare creative alternatives across perspectives and disciplines."
        }
      ]
    },
    {
      id: "4",
      name: "Acting for sustainability",
      competences: [
        {
          id: "4.1",
          name: "Political agency",
          working_descriptor:
            "Understand and engage appropriate decision-making, responsibility and accountability routes."
        },
        {
          id: "4.2",
          name: "Collective action",
          working_descriptor: "Plan and act collaboratively for sustainability change."
        },
        {
          id: "4.3",
          name: "Individual initiative",
          working_descriptor:
            "Recognise personal potential and take meaningful, responsible initiative."
        }
      ]
    }
  ],
  scoring: {
    "0": "Absent from the reviewed text",
    "1": "Mentioned or isolated",
    "2": "Purposeful and observable",
    "3": "Embedded across objectives, learning and assessment"
  }
};

export const ALL_COMPETENCE_IDS: string[] = GREENCOMP.areas.flatMap((area) =>
  area.competences.map((c) => c.id)
);

export function getCompetence(id: string): Competence | undefined {
  for (const area of GREENCOMP.areas) {
    const found = area.competences.find((c) => c.id === id);
    if (found) return found;
  }
  return undefined;
}

// UI-facing rubric labels. GreenComp's own scoring text ("mentioned or
// isolated", etc.) is kept as the detailed explanation; these short labels
// are the ones PROJECT_BRIEF §8 asks the interface to show instead of a
// traffic-light verdict.
export const SCORE_LABELS: Record<0 | 1 | 2 | 3, string> = {
  0: "Not yet observed",
  1: "Emerging",
  2: "Purposeful",
  3: "Embedded"
};
