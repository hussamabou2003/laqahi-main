import * as XLSX from 'xlsx'

/**
 * تصدير البيانات إلى ملف Excel حقيقي (.xlsx) بدلاً من CSV
 * @param {string} filename اسم الملف
 * @param {string[]} headers عناوين الأعمدة
 * @param {Array<Array<string|number>>} rows مصفوفة البيانات
 */
export function exportCSV(filename, headers, rows) {
  // دمج العناوين مع البيانات في مصفوفة واحدة
  const data = [headers, ...rows]
  
  // إنشاء ورقة عمل (Worksheet) من المصفوفة
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // اتجاه الصفحة من اليمين لليسار (للغة العربية)
  ws['!dir'] = 'rtl'

  // إنشاء كتاب عمل (Workbook) وإضافة الورقة إليه
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'البيانات')

  // حفظ الملف وتنزيله
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/**
 * تصدير مصفوفة بيانات إلى PDF عبر نافذة طباعة المتصفح (Print to PDF).
 *
 * ملاحظة تقنية مهمة: مكتبات مثل jsPDF لا "تُشكّل" الحروف العربية (Arabic text shaping)
 * بشكل صحيح افتراضيًا — تظهر الحروف منفصلة أو معكوسة الاتجاه لأنها تصمم أساسًا لخطوط
 * لاتينية. الحل الموثوق دون تعقيد إضافي (تحويل خط عربي إلى Base64 وتضمينه يدويًا) هو
 * الاعتماد على محرك عرض النصوص في المتصفح نفسه، الذي يدعم العربية وRTL بشكل مثالي:
 * نفتح نافذة جديدة بمحتوى منسّق ثم نستدعي نافذة الطباعة، ويختار المستخدم
 * "حفظ كـ PDF" كوجهة الطباعة. النتيجة ملف PDF حقيقي بنص عربي سليم ومقروء 100%.
 *
 * @param {string} title عنوان التقرير
 * @param {string[]} headers عناوين الأعمدة
 * @param {Array<Array<string|number>>} rows صفوف البيانات
 * @param {string} filename اسم الملف (يُستخدم كعنوان لنافذة الطباعة فقط)
 */

export function exportPDF(title, headers, rows, filename) {
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    window.alert('تعذّر فتح نافذة التصدير. يرجى السماح بالنوافذ المنبثقة لهذا الموقع ثم إعادة المحاولة.')
    return
  }

  const escapeHtml = (val) =>
    String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const theadHtml = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`
  const tbodyHtml = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('')

  printWindow.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(filename || title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Tajawal', 'Segoe UI', Tahoma, sans-serif;
    direction: rtl;
    text-align: right;
    color: #16231f;
    padding: 36px;
    margin: 0;
  }
  h1 { font-size: 19px; font-weight: 800; margin: 0 0 4px; }
  .meta { font-size: 12px; color: #66756f; margin-bottom: 22px; }
  table { width: 100%; border-collapse: collapse; }
  th, td {
    border: 1px solid #e7ebea;
    padding: 9px 12px;
    font-size: 12.5px;
    text-align: right;
  }
  th { background: #0e6b52; color: #fff; font-weight: 700; }
  tbody tr:nth-child(even) td { background: #f2f5f5; }
  @media print {
    body { padding: 12px; }
    @page { margin: 16mm; }
  }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">نظام لقاحي — تاريخ الإصدار: ${new Date().toLocaleDateString('en-GB')}</p>
  <table>
    <thead>${theadHtml}</thead>
    <tbody>${tbodyHtml}</tbody>
  </table>

  <!-- التعديل هنا: أضفنا سكربت داخل النافذة ليقوم بالطباعة بنفسه -->
  <script>
    // مهلة قصيرة للسماح بتحميل خط Tajawal قبل فتح نافذة الطباعة
    setTimeout(() => {
      window.focus();
      window.print();
    }, 400);
  </script>
</body>
</html>`)
  
  printWindow.document.close()
  
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
