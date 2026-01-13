import React from 'react';
import RapportPresentation from '@/components/analyse/RapportPresentation';
import { useProjects, useDossiers } from '@/hooks';

const RapportPresentationPage: React.FC = () => {
  const { projects } = useProjects();
  const { dossiers } = useDossiers();

  return <RapportPresentation procedures={projects} dossiers={dossiers} />;
};

export default RapportPresentationPage;
