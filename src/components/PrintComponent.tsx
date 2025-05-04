import  React, { useRef } from 'react';
import { normalizeArabicText } from '../utils/arabicSupport';

interface PrintComponentProps {
  content: React.ReactNode;
  trigger: React.ReactNode;
  title?: string;
}

/**
 * Component for printing React components
 * This is an alternative to PDF generation for Arabic text
 */
const PrintComponent: React.FC<PrintComponentProps> = ({ content, trigger, title = 'Print' }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!contentRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بفتح النوافذ المنبثقة للطباعة');
      return;
    }

    // Get styles from current page
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          console.log('Error accessing stylesheet:', e);
          return '';
        }
      })
      .join('\n');

    // Get the HTML content
    const contentHtml = contentRef.current.innerHTML;

    // Write to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>${normalizeArabicText(title)}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            ${styles}
            @media print {
              @page {
                size: A4;
                margin: 1cm;
              }
              body {
                font-family: 'Tajawal', sans-serif;
                color: #333;
              }
              .no-print {
                display: none !important;
              }
            }
            body {
              font-family: 'Tajawal', sans-serif;
              direction: rtl;
              text-align: right;
              padding: 20px;
              background-color: white;
            }
            .print-container {
              max-width: 800px;
              margin: 0 auto;
            }
            .print-button {
              background-color: #800000;
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 16px;
              border-radius: 4px;
              cursor: pointer;
              margin: 20px auto;
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${contentHtml}
          </div>
          <button class="print-button no-print" onclick="window.print(); setTimeout(() => window.close(), 500);">
            طباعة
          </button>
          <script>
            // Auto-print after fonts load
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <>
      <div onClick={handlePrint} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      <div style={{ display: 'none' }}>
        <div ref={contentRef}>{content}</div>
      </div>
    </>
  );
};

export default PrintComponent;
 