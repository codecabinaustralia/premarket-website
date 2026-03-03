import { adminDb } from '../../firebase/adminApp';
import { sendEmail } from './resendService';

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
  return '$' + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

async function buildReport(propertyId) {
  const propertySnap = await adminDb.collection('properties').doc(propertyId).get();
  if (!propertySnap.exists) throw new Error('Property not found');
  const property = { id: propertySnap.id, ...propertySnap.data() };

  const offersSnap = await adminDb
    .collection('offers')
    .where('propertyId', '==', propertyId)
    .where('type', '==', 'opinion')
    .get();

  const serious = [];
  const passive = [];
  for (const doc of offersSnap.docs) {
    const data = doc.data();
    if (data.serious === true) serious.push(data);
    else passive.push(data);
  }

  const seriousMedian = median(serious.map((o) => o.offerAmount || 0));
  const passiveMedian = median(passive.map((o) => o.offerAmount || 0));
  const combinedMedian = median([
    ...serious.map((o) => o.offerAmount || 0),
    ...passive.map((o) => o.offerAmount || 0),
  ]);

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
    agents: agents.slice(0, 3),
  };
}

export async function gatherReport(email, propertyId) {
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

  let confidence = { label: 'Low', color: 'red' };
  if (report.seriousCount > 1) confidence = { label: 'High', color: 'green' };
  else if (report.seriousCount === 1) confidence = { label: 'Medium', color: 'orange' };

  const imgUrl = report.property.imageUrls?.[0] || '';
  const title = report.property.title || 'Untitled Property';
  const address = report.property.address || '';

  const html = `
    <div style="font-family:Arial, Helvetica, sans-serif; color:#333; background:#fff; padding:20px; border-radius:12px;">
      <p style="font-size:14px; color:#555;">Hi ${report.property.clientName},</p>
      <p style="font-size:14px; color:#555;">I've used the power of <strong>Premarket</strong> to promote your property to investors and buyers and gather their price opinions. We've then segmented those buyers into two groups:</p>
      <ul style="font-size:14px; color:#555; margin:10px 0 20px 20px; padding:0;">
        <li><strong>Passive buyers</strong> – property enthusiasts who like to give their opinions and feedback.</li>
        <li><strong>Serious buyers</strong> – buyers who have expressed genuine interest in your property and will be the first people we contact if you choose to work with us.</li>
      </ul>
      <p style="font-size:14px; color:#555;">Here's your private Premarket insight report:</p>
      <h2 style="margin:20px 0 10px; color:#111;">${title}</h2>
      <p style="margin:0 0 20px; font-size:14px; color:#777;">${address}</p>
      ${imgUrl ? `<img src="${imgUrl}" alt="Property" style="max-width:100%; border-radius:10px; margin-bottom:20px;"/>` : ''}
      <h3 style="margin-top:20px; color:#111;">Confidence Score: <span style="color:${confidence.color};">${confidence.label}</span></h3>
      <h3 style="margin-top:30px; color:#111;">Buyer Insights</h3>
      <table width="100%" cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse; font-size:14px; margin-top:10px;">
        <tr><th align="left">Serious Buyers</th><td>${report.seriousCount}</td><td>${fmtMoney(report.seriousMedian)}</td></tr>
        <tr><th align="left">Passive Buyers</th><td>${report.passiveCount}</td><td>${fmtMoney(report.passiveMedian)}</td></tr>
        <tr><th align="left">Combined Median</th><td>${report.seriousCount + report.passiveCount}</td><td>${fmtMoney(report.combinedMedian)}</td></tr>
      </table>
      <h3 style="margin-top:30px; color:#111;">Recommended Agent${agents.length > 1 ? 's' : ''}</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px; border:1px solid #eee;">${agentHtml}</table>
      <p style="margin-top:30px; font-size:12px; color:#777;">This report is powered by Premarket to help sellers and buyers make better, more confident decisions.</p>
    </div>`;

  await sendEmail({
    to: email,
    subject: `Premarket Report: ${title}`,
    html,
  });

  return { success: true };
}
