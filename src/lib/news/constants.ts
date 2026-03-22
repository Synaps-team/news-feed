import type { NewsCategory } from "@/lib/news/types";

export const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  AI: [
    "ai",
    "llm",
    "multimodal",
    "agent",
    "model release",
    "computer vision",
    "generative ai",
    "machine learning",
    "inference",
    "reasoning",
  ],
  "Digital Architecture Tools": [
    "bim",
    "cad",
    "revit",
    "rhino",
    "grasshopper",
    "autodesk",
    "archicad",
    "sketchup",
    "parametric",
    "digital twin",
  ],
  "AI in Architecture": [
    "floor plan",
    "generative design",
    "aec ai",
    "architectural visualization",
    "building design automation",
    "architecture ai",
    "construction ai",
    "smart building",
    "design automation",
    "built environment ai",
  ],
};

export const TAG_KEYWORDS = [
  "llm",
  "agent",
  "multimodal",
  "bim",
  "cad",
  "revit",
  "rhino",
  "grasshopper",
  "autodesk",
  "archicad",
  "sketchup",
  "computer vision",
  "generative design",
  "digital twin",
  "smart building",
  "architectural visualization",
];

export const SOURCE_QUALITY_WEIGHTS: Record<string, number> = {
  "Google AI Blog": 0.95,
  "OpenAI News": 0.95,
  "MIT News": 0.92,
  "NVIDIA Blog": 0.9,
  ArchDaily: 0.88,
  Autodesk: 0.9,
  "AEC Magazine": 0.85,
  "News API": 0.72,
  X: 0.6,
};

export const MAX_ITEMS_PER_CATEGORY = 12;
