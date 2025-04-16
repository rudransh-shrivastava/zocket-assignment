import EditTaskClient from "./EditTaskClient";

export type Params = Promise<{ id: string }>;

export default async function EditTaskPage({ params }: { params: Params }) {
  const { id } = await params;

  return <EditTaskClient id={id} />;
}
