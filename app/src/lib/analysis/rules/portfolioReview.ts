import type { GapRule } from "../types";
import { excerpt, firstMatchingLine, locationLabel } from "../context";
import { getContextNote } from "../../../data/contextPack";

const TEACHER_ONLY_REVIEW = /the teacher will record|after the final presentation,? the teacher will|teacher(-only)? review/i;
const PUPIL_REVIEW = /pupils (reflect|review|self-assess)|joint (pupil-teacher )?review|pupil voice in (the )?review/i;
const FIXED_SINGLE_PRODUCT = /the (final )?poster format .* should remain the same|a poster and a (three-minute )?presentation/i;

export const portfolioReviewRule: GapRule = ({ ctx }) => {
  const sections = ctx.sectionsOf([
    "final_product",
    "local_adaptation",
    "european_dimension",
    "preparation",
    "review"
  ]);
  if (sections.length === 0) return [];

  const combined = sections.map((s) => s.text).join("\n");
  const hasTeacherOnlyReview = TEACHER_ONLY_REVIEW.test(combined);
  const hasFixedProduct = FIXED_SINGLE_PRODUCT.test(combined);
  if (!hasTeacherOnlyReview && !hasFixedProduct) return [];
  if (PUPIL_REVIEW.test(combined)) return [];

  const triggerLine =
    firstMatchingLine(combined, TEACHER_ONLY_REVIEW) ??
    firstMatchingLine(combined, FIXED_SINGLE_PRODUCT) ??
    combined;

  return [
    {
      category: "portfolio_and_review",
      priority: "medium",
      confidence: "medium",
      location: locationLabel(sections),
      current_excerpt: excerpt(triggerLine),
      observed_gap:
        "A single fixed product hides the pupils' process, and the end-of-unit review is described as teacher-only. Pupils are not asked to review their own learning or process.",
      competence_ids: ["1.2", "3.2", "4.2", "4.3"],
      suggested_wording:
        "Keep the poster and presentation as the public output, and add a lightweight portfolio (photos, notes, source checks, group decisions) reviewed jointly by pupils and teacher at the end of the unit.",
      implementation_example:
        "Add a one-page portfolio cover sheet pupils fill in themselves (what we found, what we decided, what we would do differently) and use it in a short joint review conversation with the teacher.",
      assessment_evidence:
        "The completed portfolio cover sheet and brief notes from the joint pupil-teacher review conversation.",
      european_schools_context: getContextNote("portfolio_and_review"),
      rule_basis: [
        "Rule: portfolio_and_review — matched teacher-only review wording or a fixed single-product description without matching any pupil self-review or joint-review wording."
      ]
    }
  ];
};
