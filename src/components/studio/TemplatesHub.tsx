import React from 'react';
import { StudioTemplateGallery } from './StudioTemplateGallery';
import { StudioTemplateDetails } from './StudioTemplateDetails';
import type { StudioTemplate } from './types';

interface TemplatesHubProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ar' | 'en';
  onUseTemplate: (template: StudioTemplate) => Promise<void> | void;
  selectedTemplate: StudioTemplate | null;
  onSelectTemplate: (template: StudioTemplate | null) => void;
}

export const TemplatesHub: React.FC<TemplatesHubProps> = ({
  isOpen,
  onClose,
  language,
  onUseTemplate,
  selectedTemplate,
  onSelectTemplate
}) => {
  return (
    <>
      <StudioTemplateGallery
        isOpen={isOpen}
        onClose={onClose}
        language={language}
        onSelectTemplate={(tmpl) => {
          onSelectTemplate(tmpl);
        }}
      />

      <StudioTemplateDetails
        template={selectedTemplate}
        isOpen={!!selectedTemplate}
        language={language}
        onClose={() => onSelectTemplate(null)}
        onUseTemplate={async (tmpl) => {
          await onUseTemplate(tmpl);
          onSelectTemplate(null);
          onClose();
        }}
      />
    </>
  );
};
