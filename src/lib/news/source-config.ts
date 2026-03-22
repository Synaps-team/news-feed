import sourceConfig from "../../../data/sources.json";
import type { SourceConfig } from "@/lib/news/types";

export function getEnabledSources(): SourceConfig[] {
  return (sourceConfig as SourceConfig[]).filter((source) => source.enabled);
}
