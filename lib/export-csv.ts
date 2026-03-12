import type { EvidenceRecord } from "@/types";

const HEADERS: { key: keyof EvidenceRecord | "tagsJoined" | "badgesJoined"; label: string }[] = [
  { key: "contactName", label: "Nome" },
  { key: "phone", label: "Telefone" },
  { key: "email", label: "Email" },
  { key: "funnelStep", label: "Etapa" },
  { key: "sdr", label: "SDR" },
  { key: "closer", label: "Closer" },
  { key: "value", label: "Valor" },
  { key: "utmSource", label: "UTM Source" },
  { key: "utmMedium", label: "UTM Medium" },
  { key: "utmCampaign", label: "UTM Campaign" },
  { key: "tagsJoined", label: "Tags" },
  { key: "badgesJoined", label: "Badges" },
  { key: "createdAt", label: "Data" },
  { key: "crmUrl", label: "CRM URL" },
];

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function recordToRow(record: EvidenceRecord): string {
  return HEADERS.map((h) => {
    let val: string;
    switch (h.key) {
      case "tagsJoined":
        val = record.tags.join("; ");
        break;
      case "badgesJoined":
        val = record.badges.join("; ");
        break;
      case "value":
        val = record.value !== undefined ? record.value.toFixed(2) : "";
        break;
      case "createdAt":
        val = new Date(record.createdAt).toLocaleDateString("pt-BR");
        break;
      default:
        val = String(record[h.key] ?? "");
    }
    return escapeCSV(val);
  }).join(",");
}

export function exportEvidenceCSV(records: EvidenceRecord[], filename = "evidencias.csv") {
  if (records.length === 0) return;

  const headerRow = HEADERS.map((h) => escapeCSV(h.label)).join(",");
  const dataRows = records.map(recordToRow);
  const csvContent = [headerRow, ...dataRows].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
