import { adminDb } from '../../firebase/adminApp';
import { sendEmail } from './resendService';
import PDFDocument from 'pdfkit';

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function fmtMoney(v) {
  if (!v) return '$0';
  return '$' + Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function buildPriceDistribution(opinions, bucketCount = 5) {
  const amounts = opinions.map(o => o.offerAmount || 0).filter(a => a > 0);
  if (!amounts.length) return [];
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  if (min === max) return [{ label: fmtMoney(min), count: amounts.length, pct: 100 }];
  const step = (max - min) / bucketCount;
  const buckets = [];
  for (let i = 0; i < bucketCount; i++) {
    const lo = min + step * i;
    const hi = i === bucketCount - 1 ? max + 1 : min + step * (i + 1);
    const count = amounts.filter(a => a >= lo && a < hi).length;
    buckets.push({
      label: `${fmtMoney(lo)} – ${fmtMoney(i === bucketCount - 1 ? max : hi)}`,
      count,
      pct: amounts.length > 0 ? Math.round((count / amounts.length) * 100) : 0,
    });
  }
  return buckets;
}

async function buildReport(propertyId) {
  const propertySnap = await adminDb.collection('properties').doc(propertyId).get();
  if (!propertySnap.exists) throw new Error('Property not found');
  const property = { id: propertySnap.id, ...propertySnap.data() };

  const [offersSnap, likesSnap] = await Promise.all([
    adminDb.collection('offers').where('propertyId', '==', propertyId).where('type', '==', 'opinion').get(),
    adminDb.collection('likes').where('propertyId', '==', propertyId).get(),
  ]);

  const serious = [];
  const passive = [];
  const allOpinions = [];
  for (const d of offersSnap.docs) {
    const data = d.data();
    allOpinions.push(data);
    if (data.serious === true) serious.push(data);
    else passive.push(data);
  }

  const seriousMedian = median(serious.map((o) => o.offerAmount || 0));
  const passiveMedian = median(passive.map((o) => o.offerAmount || 0));
  const combinedMedian = median([
    ...serious.map((o) => o.offerAmount || 0),
    ...passive.map((o) => o.offerAmount || 0),
  ]);

  // Buyer breakdown
  const fhbCount = allOpinions.filter(o => o.isFirstHomeBuyer).length;
  const investorCount = allOpinions.filter(o => o.isInvestor).length;

  // Price range
  const allAmounts = allOpinions.map(o => o.offerAmount || 0).filter(a => a > 0);
  const priceMin = allAmounts.length ? Math.min(...allAmounts) : 0;
  const priceMax = allAmounts.length ? Math.max(...allAmounts) : 0;

  // Price distribution buckets
  const priceDistribution = buildPriceDistribution(allOpinions);

  // Listing vs median percentage
  const listingNum = parseFloat(String(property.price || '0').replace(/[^0-9.]/g, '')) || 0;
  const listingVsMedianPct = listingNum && combinedMedian
    ? Math.round(((combinedMedian - listingNum) / listingNum) * 100)
    : null;

  const agentsSnap = await adminDb.collection('agents').get();
  let agents = agentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (property.latitude && property.longitude) {
    agents.forEach((a) => {
      if (a.latitude && a.longitude) {
        a.dist = Math.pow(a.latitude - property.latitude, 2) + Math.pow(a.longitude - property.longitude, 2);
      } else {
        a.dist = Number.MAX_VALUE;
      }
    });
    agents.sort((a, b) => a.dist - b.dist);
  }

  return {
    property,
    seriousCount: serious.length,
    passiveCount: passive.length,
    seriousMedian,
    passiveMedian,
    combinedMedian,
    likesCount: likesSnap.size,
    fhbCount,
    investorCount,
    priceMin,
    priceMax,
    priceDistribution,
    listingVsMedianPct,
    agents: agents.slice(0, 3),
  };
}

async function generateReportPDF(report) {
  const title = report.property.title || 'Untitled Property';
  const address = report.property.formattedAddress || report.property.address || '';
  const listingPrice = report.property.price;

  let confidence = { label: 'Low' };
  if (report.seriousCount > 1) confidence = { label: 'High' };
  else if (report.seriousCount === 1) confidence = { label: 'Medium' };

  // Fetch logo
  let logoBuffer;
  try {
    const logoRes = await fetch('https://premarketvideos.b-cdn.net/assets/logo.png');
    if (logoRes.ok) logoBuffer = Buffer.from(await logoRes.arrayBuffer());
  } catch { /* skip logo if fetch fails */ }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const orange = '#E97316';
    const dark = '#1E293B';
    const grey = '#64748B';
    const pageWidth = doc.page.width - 100; // margins

    // --- Logo ---
    if (logoBuffer) {
      doc.image(logoBuffer, 50, 40, { width: 140 });
      doc.moveDown(3);
    }

    // --- Divider ---
    doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor(orange).lineWidth(2).stroke();
    doc.moveDown(1);

    // --- Title ---
    doc.fontSize(22).fillColor(dark).text(title, { align: 'left' });
    if (address) {
      doc.fontSize(11).fillColor(grey).text(address);
    }
    doc.moveDown(0.5);

    // --- Listing Price ---
    if (listingPrice) {
      doc.fontSize(10).fillColor(grey).text('Listing Price');
      doc.fontSize(18).fillColor(dark).text(fmtMoney(parseFloat(String(listingPrice).replace(/[^0-9.]/g, '')) || 0));
      doc.moveDown(0.5);
    }

    // --- Confidence Score ---
    doc.fontSize(10).fillColor(grey).text('Confidence Score');
    doc.fontSize(16).fillColor(orange).text(confidence.label);
    doc.moveDown(1);

    // --- Section: Engagement ---
    doc.fontSize(14).fillColor(dark).text('Engagement Overview');
    doc.moveTo(50, doc.y + 2).lineTo(50 + pageWidth, doc.y + 2).strokeColor('#E2E8F0').lineWidth(1).stroke();
    doc.moveDown(0.5);

    const views = report.property.stats?.views || 0;
    const totalBuyers = report.seriousCount + report.passiveCount;
    doc.fontSize(10).fillColor(grey);
    doc.text(`Total Views: ${views}          Price Opinions: ${totalBuyers}          Serious Buyers: ${report.seriousCount}          Likes: ${report.likesCount}`);
    doc.moveDown(1);

    // --- Listing vs Median ---
    if (report.listingVsMedianPct !== null) {
      doc.fontSize(14).fillColor(dark).text('Listing vs Median Comparison');
      doc.moveTo(50, doc.y + 2).lineTo(50 + pageWidth, doc.y + 2).strokeColor('#E2E8F0').lineWidth(1).stroke();
      doc.moveDown(0.5);
      const direction = report.listingVsMedianPct >= 0 ? 'above' : 'below';
      doc.fontSize(10).fillColor(grey);
      doc.text(`Buyer median is ${Math.abs(report.listingVsMedianPct)}% ${direction} listing price`);
      doc.moveDown(1);
    }

    // --- Price Range ---
    if (report.priceMin > 0) {
      doc.fontSize(14).fillColor(dark).text('Price Range');
      doc.moveTo(50, doc.y + 2).lineTo(50 + pageWidth, doc.y + 2).strokeColor('#E2E8F0').lineWidth(1).stroke();
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor(grey);
      doc.text(`Lowest: ${fmtMoney(report.priceMin)}          Highest: ${fmtMoney(report.priceMax)}`);
      doc.moveDown(1);
    }

    // --- Section: Price Intelligence ---
    doc.fontSize(14).fillColor(dark).text('Price Intelligence');
    doc.moveTo(50, doc.y + 2).lineTo(50 + pageWidth, doc.y + 2).strokeColor('#E2E8F0').lineWidth(1).stroke();
    doc.moveDown(0.5);

    // Table
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 250;
    const col3 = 380;
    const rowH = 28;

    // Header
    doc.fontSize(9).fillColor(grey);
    doc.text('Category', col1, tableTop);
    doc.text('Count', col2, tableTop);
    doc.text('Median Price', col3, tableTop);

    // Row 1 - Serious
    const r1 = tableTop + rowH;
    doc.rect(col1, r1 - 4, pageWidth, rowH).fillColor('#F8FAFC').fill();
    doc.fontSize(10).fillColor(dark);
    doc.text('Serious Buyers', col1 + 8, r1 + 4);
    doc.text(String(report.seriousCount), col2, r1 + 4);
    doc.text(fmtMoney(report.seriousMedian), col3, r1 + 4);

    // Row 2 - Passive
    const r2 = r1 + rowH;
    doc.fontSize(10).fillColor(dark);
    doc.text('Passive Buyers', col1 + 8, r2 + 4);
    doc.text(String(report.passiveCount), col2, r2 + 4);
    doc.text(fmtMoney(report.passiveMedian), col3, r2 + 4);

    // Row 3 - Combined
    const r3 = r2 + rowH;
    doc.rect(col1, r3 - 4, pageWidth, rowH).fillColor('#F8FAFC').fill();
    doc.fontSize(10).fillColor(dark).font('Helvetica-Bold');
    doc.text('Combined', col1 + 8, r3 + 4);
    doc.text(String(totalBuyers), col2, r3 + 4);
    doc.text(fmtMoney(report.combinedMedian), col3, r3 + 4);
    doc.font('Helvetica');

    doc.y = r3 + rowH + 16;

    // --- Buyer Breakdown ---
    if (report.fhbCount > 0 || report.investorCount > 0) {
      doc.fontSize(14).fillColor(dark).text('Buyer Breakdown');
      doc.moveTo(50, doc.y + 2).lineTo(50 + pageWidth, doc.y + 2).strokeColor('#E2E8F0').lineWidth(1).stroke();
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor(grey);
      doc.text(`First Home Buyers: ${report.fhbCount}          Investors: ${report.investorCount}`);
      doc.moveDown(1);
    }

    // --- Footer ---
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor('#E2E8F0').lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor(grey).text(
      'This report is generated by Premarket to help sellers and buyers make better, more confident decisions.',
      { align: 'center' }
    );
    doc.fontSize(8).text(`Report generated on ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: 'center' });

    doc.end();
  });
}

export async function gatherReport(email, propertyId, name) {
  const report = await buildReport(propertyId);

  const userSnap = await adminDb.collection('users').doc(report.property.userId).get();
  const userData = userSnap.exists ? userSnap.data() : {};

  let agents = [];
  if (userData.agentPro === true && userData.agentId) {
    const agentSnap = await adminDb.collection('agents').doc(userData.agentId).get();
    if (agentSnap.exists) {
      agents.push({ id: agentSnap.id, ...agentSnap.data() });
    }
  } else {
    agents = report.agents;
  }

  const agentHtml = agents
    .map(
      (agent) => `
    <tr>
      <td style="padding:12px; border:1px solid #eee;">
        <table width="100%">
          <tr>
            <td style="width:50px; vertical-align:middle;">
              ${agent.logo ? `<img src="${agent.logo}" width="50" height="50" style="border-radius:6px;" />` : `<div style="width:50px; height:50px; background:#ddd; border-radius:6px;"></div>`}
            </td>
            <td style="padding-left:12px; vertical-align:middle;">
              <strong style="color:#333;">${agent.companyName || 'Unknown Company'}</strong><br/>
              <span style="font-size:12px; color:#777;">${agent.suburb || ''}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join('');

  let confidence = { label: 'Low', color: '#EF4444' };
  if (report.seriousCount > 1) confidence = { label: 'High', color: '#22C55E' };
  else if (report.seriousCount === 1) confidence = { label: 'Medium', color: '#F97316' };

  const imgUrl = report.property.imageUrls?.[0] || '';
  const title = report.property.title || 'Untitled Property';
  const address = report.property.address || '';
  const greeting = name || report.property.clientName || 'there';
  const views = report.property.stats?.views || 0;
  const totalBuyers = report.seriousCount + report.passiveCount;
  const listingNum = parseFloat(String(report.property.price || '0').replace(/[^0-9.]/g, '')) || 0;

  // Build price distribution HTML
  const distHtml = report.priceDistribution.length > 0
    ? report.priceDistribution.map(b => `
      <tr>
        <td style="padding:6px 10px; font-size:13px; color:#333; white-space:nowrap;">${b.label}</td>
        <td style="padding:6px 10px; width:60%;">
          <div style="background:#F1F5F9; border-radius:4px; height:20px; width:100%;">
            <div style="background:#F97316; border-radius:4px; height:20px; width:${Math.max(b.pct, 2)}%; min-width:2px;"></div>
          </div>
        </td>
        <td style="padding:6px 10px; font-size:13px; color:#666; text-align:right; white-space:nowrap;">${b.count} (${b.pct}%)</td>
      </tr>
    `).join('')
    : '';

  // Listing vs median section
  let listingVsMedianHtml = '';
  if (report.listingVsMedianPct !== null) {
    const direction = report.listingVsMedianPct >= 0 ? 'above' : 'below';
    const dirColor = report.listingVsMedianPct >= 0 ? '#22C55E' : '#EF4444';
    listingVsMedianHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr>
          <td style="padding:16px; background:#F8FAFC; border-radius:8px; border:1px solid #E2E8F0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center; padding:8px;">
                  <div style="font-size:12px; color:#64748B; margin-bottom:4px;">Listing Price</div>
                  <div style="font-size:20px; font-weight:bold; color:#1E293B;">${fmtMoney(listingNum)}</div>
                </td>
                <td style="text-align:center; padding:8px; font-size:24px; color:#94A3B8;">→</td>
                <td style="text-align:center; padding:8px;">
                  <div style="font-size:12px; color:#64748B; margin-bottom:4px;">Combined Median</div>
                  <div style="font-size:20px; font-weight:bold; color:#1E293B;">${fmtMoney(report.combinedMedian)}</div>
                </td>
                <td style="text-align:center; padding:8px;">
                  <div style="font-size:12px; color:#64748B; margin-bottom:4px;">Difference</div>
                  <div style="font-size:20px; font-weight:bold; color:${dirColor};">${report.listingVsMedianPct >= 0 ? '+' : ''}${report.listingVsMedianPct}%</div>
                  <div style="font-size:11px; color:${dirColor};">${direction} listing</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
  }

  // Generate PDF
  const pdfBuffer = await generateReportPDF(report);

  const html = `
    <div style="font-family:Arial, Helvetica, sans-serif; color:#333; background:#fff; padding:20px; border-radius:12px; max-width:600px; margin:0 auto;">
      <p style="font-size:14px; color:#555;">Hi ${greeting},</p>
      <p style="font-size:14px; color:#555;">I've used the power of <strong>Premarket</strong> to promote your property to investors and buyers and gather their price opinions. We've then segmented those buyers into two groups:</p>
      <ul style="font-size:14px; color:#555; margin:10px 0 20px 20px; padding:0;">
        <li><strong>Passive buyers</strong> – property enthusiasts who like to give their opinions and feedback.</li>
        <li><strong>Serious buyers</strong> – buyers who have expressed genuine interest in your property and will be the first people we contact if you choose to work with us.</li>
      </ul>
      <p style="font-size:14px; color:#555;">Here's your private Premarket insight report:</p>
      <h2 style="margin:20px 0 10px; color:#111;">${title}</h2>
      <p style="margin:0 0 20px; font-size:14px; color:#777;">${address}</p>
      ${imgUrl ? `<img src="${imgUrl}" alt="Property" style="max-width:100%; border-radius:10px; margin-bottom:20px;"/>` : ''}

      <!-- Engagement Overview -->
      <h3 style="margin-top:24px; color:#111; font-size:16px;">Engagement Overview</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 20px;">
        <tr>
          <td style="padding:12px; text-align:center; background:#F8FAFC; border-radius:8px 0 0 8px; border:1px solid #E2E8F0;">
            <div style="font-size:22px; font-weight:bold; color:#1E293B;">${views}</div>
            <div style="font-size:11px; color:#64748B; margin-top:2px;">Views</div>
          </td>
          <td style="padding:12px; text-align:center; background:#F8FAFC; border:1px solid #E2E8F0; border-left:none;">
            <div style="font-size:22px; font-weight:bold; color:#1E293B;">${totalBuyers}</div>
            <div style="font-size:11px; color:#64748B; margin-top:2px;">Opinions</div>
          </td>
          <td style="padding:12px; text-align:center; background:#F8FAFC; border:1px solid #E2E8F0; border-left:none;">
            <div style="font-size:22px; font-weight:bold; color:#1E293B;">${report.seriousCount}</div>
            <div style="font-size:11px; color:#64748B; margin-top:2px;">Serious</div>
          </td>
          <td style="padding:12px; text-align:center; background:#F8FAFC; border-radius:0 8px 8px 0; border:1px solid #E2E8F0; border-left:none;">
            <div style="font-size:22px; font-weight:bold; color:#1E293B;">${report.likesCount}</div>
            <div style="font-size:11px; color:#64748B; margin-top:2px;">Likes</div>
          </td>
        </tr>
      </table>

      <h3 style="margin-top:20px; color:#111;">Confidence Score: <span style="color:${confidence.color};">${confidence.label}</span></h3>

      ${listingVsMedianHtml}

      <!-- Three Median Cards -->
      <h3 style="margin-top:24px; color:#111; font-size:16px;">Median Price Opinions</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 20px;">
        <tr>
          <td style="padding:12px; text-align:center; background:#FFF7ED; border-radius:8px 0 0 8px; border:1px solid #FED7AA;">
            <div style="font-size:11px; color:#9A3412; margin-bottom:4px;">Serious Buyers</div>
            <div style="font-size:18px; font-weight:bold; color:#1E293B;">${fmtMoney(report.seriousMedian)}</div>
          </td>
          <td style="padding:12px; text-align:center; background:#F8FAFC; border:1px solid #E2E8F0; border-left:none;">
            <div style="font-size:11px; color:#64748B; margin-bottom:4px;">Passive Buyers</div>
            <div style="font-size:18px; font-weight:bold; color:#1E293B;">${fmtMoney(report.passiveMedian)}</div>
          </td>
          <td style="padding:12px; text-align:center; background:#F8FAFC; border-radius:0 8px 8px 0; border:1px solid #E2E8F0; border-left:none;">
            <div style="font-size:11px; color:#64748B; margin-bottom:4px;">Combined</div>
            <div style="font-size:18px; font-weight:bold; color:#1E293B;">${fmtMoney(report.combinedMedian)}</div>
          </td>
        </tr>
      </table>

      <!-- Price Range -->
      ${report.priceMin > 0 ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 20px;">
        <tr>
          <td style="padding:12px; background:#F8FAFC; border-radius:8px; border:1px solid #E2E8F0;">
            <div style="font-size:12px; color:#64748B; margin-bottom:4px;">Price Range</div>
            <div style="font-size:16px; font-weight:bold; color:#1E293B;">${fmtMoney(report.priceMin)} – ${fmtMoney(report.priceMax)}</div>
          </td>
        </tr>
      </table>
      ` : ''}

      <!-- Price Distribution -->
      ${distHtml ? `
      <h3 style="margin-top:24px; color:#111; font-size:16px;">Price Distribution</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 20px; border:1px solid #E2E8F0; border-radius:8px; overflow:hidden;">
        ${distHtml}
      </table>
      ` : ''}

      <!-- Buyer Breakdown -->
      <h3 style="margin-top:24px; color:#111; font-size:16px;">Buyer Breakdown</h3>
      <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse; font-size:14px; margin-top:10px; border:1px solid #E2E8F0; border-radius:8px;">
        <tr style="background:#F8FAFC;">
          <td style="padding:10px 14px; color:#64748B; font-size:12px;">Serious Buyers</td>
          <td style="padding:10px 14px; font-weight:bold; color:#1E293B;">${report.seriousCount}</td>
          <td style="padding:10px 14px; color:#64748B; font-size:12px;">Passive Buyers</td>
          <td style="padding:10px 14px; font-weight:bold; color:#1E293B;">${report.passiveCount}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px; color:#64748B; font-size:12px;">First Home Buyers</td>
          <td style="padding:10px 14px; font-weight:bold; color:#1E293B;">${report.fhbCount}</td>
          <td style="padding:10px 14px; color:#64748B; font-size:12px;">Investors</td>
          <td style="padding:10px 14px; font-weight:bold; color:#1E293B;">${report.investorCount}</td>
        </tr>
      </table>

      <h3 style="margin-top:30px; color:#111;">Recommended Agent${agents.length > 1 ? 's' : ''}</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px; border:1px solid #eee;">${agentHtml}</table>
      <p style="margin-top:30px; font-size:12px; color:#777;">This report is powered by Premarket to help sellers and buyers make better, more confident decisions.</p>
    </div>`;

  await sendEmail({
    to: email,
    subject: `Premarket Report: ${title}`,
    html,
    attachments: [{ filename: 'Premarket-Report.pdf', content: pdfBuffer }],
  });

  return { success: true };
}
