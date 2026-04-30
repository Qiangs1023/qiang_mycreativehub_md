import { createFileRoute } from "@tanstack/react-router";
import { ContentEditor, type FieldDef } from "@/components/admin/ContentEditor";

const fields: FieldDef[] = [
  { name: "title", label: "标题", type: "text", required: true },
  { name: "slug", label: "Slug", type: "text" },
  { name: "excerpt", label: "摘要", type: "textarea" },
  { name: "cover_url", label: "封面图（可选）", type: "image" },
  { name: "content", label: "正文（Markdown）", type: "markdown" },
];

export const Route = createFileRoute("/admin/about/$id")({
  component: AboutEdit,
});

function AboutEdit() {
  const { id } = Route.useParams();
  return (
    <ContentEditor table="about" id={id} fields={fields} listPath="/admin/about" title="关于页" />
  );
}
