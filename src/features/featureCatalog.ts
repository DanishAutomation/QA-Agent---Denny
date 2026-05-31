export interface FeatureModuleDescriptor {
  key: string;
  description: string;
}

export const featureCatalog: FeatureModuleDescriptor[] = [
  { key: "ecommerce", description: "Commerce workflows and transactional states." },
  { key: "forms", description: "Validation-centric and data entry behaviors." },
  { key: "brokenLinks", description: "Link integrity and HTTP health checks." },
  { key: "responsive", description: "Cross-device viewport and layout validations." },
  { key: "accessibility", description: "A11y rules, semantics, and contrast checks." },
  { key: "staticPages", description: "Static content stability and consistency checks." },
  { key: "customCommands", description: "Project-specific QA command extensions." },
];
