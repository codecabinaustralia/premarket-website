import AgentLanding from '../../components/AgentLanding'; // adjust path as needed

export default function Page({ params }) {
  return <AgentLanding id={params.id} />;
}