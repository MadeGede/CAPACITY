import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { RequestDetail } from "@/components/requests/request-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><Header /><RequestDetail id={id} /><Footer /></>;
}
