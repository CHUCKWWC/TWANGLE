import RetreatBuilder from '../RetreatBuilder';

export default function RetreatBuilderExample() {
  return (
    <RetreatBuilder
      onSaveRetreat={(retreat) => {
        console.log('Retreat saved:', retreat);
      }}
    />
  );
}
