import Root from "@/components/Root";

// A página é montada no navegador, nunca pré-renderizada no servidor.
export const dynamic = "force-dynamic";

export default function Page() {
  return <Root />;
}
