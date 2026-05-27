import { redirect } from "next/navigation";

export default async function CatalogoDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/buscar/${id}`);
}
