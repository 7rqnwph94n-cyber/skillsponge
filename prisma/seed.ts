import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString?.trim()) {
  throw new Error('DATABASE_URL is required for seeding.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

async function main() {
  await prisma.auditEvent.deleteMany();
  await prisma.handoverTask.deleteMany();
  await prisma.handoverPack.deleteMany();
  await prisma.expertProfile.deleteMany();
  await prisma.knowledgeRecordVersion.deleteMany();
  await prisma.knowledgeRelation.deleteMany();
  await prisma.knowledgeRecord.deleteMany();
  await prisma.appUser.deleteMany();

  const [technician, senior, supervisor, reviewer, admin] = await Promise.all([
    prisma.appUser.create({
      data: {
        username: 'technician',
        passwordHash: await bcrypt.hash('technician123', 10),
        displayName: 'Field Technician',
        role: 'TECHNICIAN'
      }
    }),
    prisma.appUser.create({
      data: {
        username: 'senior',
        passwordHash: await bcrypt.hash('senior123', 10),
        displayName: 'Senior Field Engineer',
        role: 'SENIOR_TECHNICIAN'
      }
    }),
    prisma.appUser.create({
      data: {
        username: 'supervisor',
        passwordHash: await bcrypt.hash('supervisor123', 10),
        displayName: 'Service Supervisor',
        role: 'SUPERVISOR'
      }
    }),
    prisma.appUser.create({
      data: {
        username: 'reviewer',
        passwordHash: await bcrypt.hash('reviewer123', 10),
        displayName: 'Technical Reviewer',
        role: 'REVIEWER'
      }
    }),
    prisma.appUser.create({
      data: {
        username: 'admin',
        passwordHash: await bcrypt.hash('admin123', 10),
        displayName: 'Service Director',
        role: 'ADMIN'
      }
    })
  ]);

  await prisma.knowledgeRecord.createMany({
    data: [
      {
        id: 'kr_proc_001',
        type: 'PROCEDURE',
        title: 'Approved method: BSTA 510 annual lubrication system service',
        summary: 'Complete lubrication system flush and refill procedure for BSTA 510 high-performance stamping press.',
        body: 'This procedure covers the full annual lubrication service for the BSTA 510 lever system, ram bearings, and slide guides. The BSTA lever mechanism distributes load across the ram and relies on minimal bearing clearances - correct lubrication grade and fill sequence is critical to maintaining press precision and longevity. Must be performed with press isolated and ram at BDC.',
        author: 'Senior Field Engineer',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA-510',
        system: 'Lubrication',
        task: 'Annual lubrication service',
        symptom: 'Scheduled maintenance',
        environment: 'Customer site - Precision pressings, Birmingham',
        scope: 'MODEL_SPECIFIC',
        tags: ['approved-method', 'lubrication', 'annual-service', 'BSTA-510', 'preventive'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-02-20'),
        createdAt: new Date('2026-01-10'),
        typePayload: {
          steps: [
            'Isolate press and confirm ram at BDC. Lock out main drive and verify zero energy state.',
            'Drain existing lubricant from central lubrication reservoir. Inspect for metal particulate or discoloration - document findings.',
            'Remove and inspect all lubrication line filters. Replace any showing >60% blockage or discoloration.',
            'Flush lubrication channels with approved OEM flushing agent (part no. BRU-LUB-FLUSH-01). Run flush pump for 15 minutes.',
            'Inspect ram bearing journals and slide guide surfaces for scoring or wear marks. Measure clearances with feeler gauge - must be within 0.005mm of factory spec.',
            'Refill with OEM-approved ISO VG 68 lubricant (part no. BRU-LUB-68). Fill to sight glass indicator line.',
            'Run central lubrication pump manually for 5 cycles. Check all distribution points for flow confirmation.',
            'Start press in inching mode. Run 50 slow strokes and check for even oil film on all bearing surfaces.',
            'Record all measurements and findings on OEM service report form. Update OEE system maintenance log.'
          ]
        }
      },
      {
        id: 'kr_note_001',
        type: 'FIELD_NOTE',
        title: 'Field note: BSTA 280 servo feed drift at high stroke rates',
        summary: 'Servo feeder losing synchronisation above 1,200 spm on customer BSTA 280. Temperature-related encoder issue identified.',
        body: 'Called to customer site for intermittent feed misalignment on their BSTA 280 running connector strip at 1,350 spm. Strip was shifting 0.15mm left after 20 minutes of continuous running. Issue only appeared above 1,200 spm and after the servo motor housing reached approximately 55°C.',
        author: 'Field Technician',
        reviewer: 'Technical Reviewer',
        approvalState: 'UNDER_REVIEW',
        confidence: 'MEDIUM',
        asset: 'BSTA-280',
        system: 'Servo feed',
        task: 'Feed alignment diagnosis',
        symptom: 'Strip drift at high stroke rates',
        environment: 'Customer site - Connector manufacturer, Hertfordshire',
        tags: ['field-observation', 'servo-feed', 'high-speed', 'temperature', 'encoder'],
        currentVersion: 1,
        createdAt: new Date('2026-03-01'),
        typePayload: {
          observation: 'Servo encoder signal degrading as motor housing temperature exceeds 55°C. Encoder mounting bracket thermal expansion causing 0.15mm positional drift. Issue not present below 1,200 spm as motor does not reach critical temperature threshold.',
          immediateAction: 'Applied temporary thermal shielding between motor and encoder bracket. Ordered replacement thermally-compensated encoder mount (part no. BRU-SRV-ENC-TC). Reduced stroke rate to 1,100 spm as interim measure until part arrives.'
        }
      },
      {
        id: 'kr_fail_001',
        type: 'FAILURE_PATTERN',
        title: 'Failure pattern: BSTA 810 shaft tile temperature rise after extended run',
        summary: 'Recurring shaft tile overheating pattern on BSTA 810 presses in automotive sector running continuous 8-hour shifts.',
        body: 'Pattern documented across three BSTA 810 installations running automotive connector strip in continuous production. Shaft tile temperature consistently rises above alarm threshold (75°C) after 6-7 hours of continuous running at >800 spm. Issue has been traced to a combination of factors related to bearing clearance specification and lubrication flow rate at sustained high speeds.',
        author: 'Senior Field Engineer',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA-810',
        system: 'Ram and lever mechanism',
        task: 'Shaft tile temperature diagnosis',
        symptom: 'Shaft tile overheating after extended run',
        environment: 'Customer site - Automotive sector',
        tags: ['failure-pattern', 'shaft-tile', 'overheating', 'BSTA-810', 'continuous-production'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-02-15'),
        createdAt: new Date('2025-11-20'),
        typePayload: {
          patternSignals: [
            'Shaft tile temperature rises steadily after 5+ hours continuous running above 800 spm',
            'Lubrication oil return temperature 8-12°C above normal after 6 hours',
            'Slight increase in press noise level precedes temperature alarm by approximately 30 minutes',
            'Issue only manifests on BSTA 810 units running above 80% of max stroke rate for extended periods'
          ],
          likelyCauses: [
            'Factory bearing clearance set to standard spec - needs opening to upper tolerance band for sustained high-speed automotive applications',
            'Central lubrication flow rate insufficient for continuous high-speed duty - flow restrictor orifice needs upsizing from 1.2mm to 1.5mm',
            'Oil cooler capacity marginal for ambient temperatures above 28°C in automotive press shops - recommend supplementary cooling circuit'
          ]
        }
      },
      {
        id: 'kr_lesson_001',
        type: 'LESSON_LEARNED',
        title: 'Lesson learned: die alignment tolerance differences between BSTA 510 and BSTA 810',
        summary: 'Critical lesson from commissioning error where BSTA 510 die alignment specs were incorrectly applied to a BSTA 810 installation.',
        body: 'During commissioning of a new BSTA 810 at an aerospace customer, die alignment was set using BSTA 510 tolerance specifications from the previous job. The BSTA 810 has different ram geometry and the lever system distributes force differently at higher tonnages. This resulted in uneven strip deformation on initial trial runs. The error was caught during quality inspection of first-off parts but could have caused tool damage if the press had been run at full production speed.',
        author: 'Senior Field Engineer',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA-810',
        system: 'Die alignment',
        task: 'Press commissioning',
        symptom: 'Uneven strip deformation on trial',
        environment: 'Customer site - Aerospace sector',
        tags: ['lesson-learned', 'commissioning', 'die-alignment', 'BSTA-810', 'tolerance'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-01-30'),
        createdAt: new Date('2025-12-05'),
        typePayload: {
          lessonPoints: [
            'Always reference the model-specific commissioning manual - BSTA 510 and 810 have different ram parallelism tolerances despite similar visual appearance',
            'BSTA 810 die alignment spec is ±0.008mm vs BSTA 510 at ±0.012mm due to the higher force distribution in the lever system',
            'Create a pre-commissioning checklist that requires explicit model number verification against the spec sheet being used',
            'On multi-press sites, label service documentation with machine serial number and model to prevent cross-reference errors',
            'Run trial parts at 25% speed before ramping up - this catches alignment issues before they can cause tool damage at full stroke rate'
          ]
        }
      },
      {
        id: 'kr_int_001',
        type: 'EXPERT_INTERVIEW',
        title: 'Expert interview: BSTA press diagnostics - Senior Field Engineer, 28 years experience',
        summary: 'Structured interview capturing tacit diagnostic knowledge from senior field service engineer with deep expertise across the full BSTA range.',
        body: 'Formal knowledge capture session conducted at Telford Competence Centre. The senior field engineer is the most experienced BSTA service engineer in the UK operation, with hands-on experience across every model from the BSTA 200 to the BSTA 2500. This interview focuses on diagnostic approach and the judgement calls that differentiate an experienced engineer from a novice.',
        author: 'Service Supervisor',
        reviewer: 'Technical Reviewer',
        approvalState: 'UNDER_REVIEW',
        confidence: 'HIGH',
        asset: 'BSTA-510',
        system: 'Ram and lever mechanism',
        task: 'General press diagnostics',
        symptom: 'Multiple - diagnostic methodology',
        environment: 'Telford Competence Centre',
        tags: ['expert-interview', 'diagnostics', 'tacit-knowledge', 'BSTA-range'],
        currentVersion: 1,
        createdAt: new Date('2026-02-25'),
        typePayload: {
          expertName: 'Senior Field Engineer',
          answers: {
            whatNoviceMisses: 'They go straight to the electronics. Nine times out of ten on a BSTA press, the root cause is mechanical - bearing wear, lubrication starvation, or a die issue that is putting asymmetric load on the ram. I always listen to the press running before I touch anything. The sound tells you more than any diagnostic screen. A healthy BSTA has a clean, rhythmic punch. Any tonal change, any vibration you can feel through the floor - that is your first clue.',
            topThreeDangerSigns: 'First: any change in the sound profile at constant speed - this usually means bearing wear or a lubrication issue developing. Second: oil return temperature creeping up over a shift - the bearings are working harder than they should be. Third: parts quality drift that the operator is compensating for by adjusting feed parameters - this masks the real problem and makes diagnosis harder later.',
            similarButDifferentFault: 'Strip feed misalignment and die wear look identical on the finished part - you get the same off-centre hit pattern. But the root cause is completely different. Feed issues are consistent and repeatable - every part is offset by the same amount. Die wear creates a progressive drift that gets worse over the production run. Check 10 parts from different points in the run and you will see the difference immediately.',
            firstCheckBeforeOpening: 'Before I open anything, I check the OEE data and the lubrication system pressure gauge. The OEE trend tells me if performance has degraded gradually or dropped suddenly - that alone narrows down the fault category. Then I check the lubrication pressure - if it is low or fluctuating, I know the bearings are not getting what they need and half the time that is your answer right there.',
            whatManualMisses: 'The manual gives you factory specifications, but every press settles into its own character after a few thousand hours. The bearing clearances that are optimal for a new press are not always optimal for a press with 15,000 hours on the clock. Experienced engineers know that the upper tolerance band works better on high-hour presses - it reduces friction heat and extends service intervals. The manual does not tell you that because it is written for new machines.'
          }
        }
      },
      {
        id: 'kr_shad_001',
        type: 'SHADOWING_RECORD',
        title: 'Shadowing record: BSTA 410 commissioning and customer handover',
        summary: 'Junior engineer shadowed full press commissioning at EV connector manufacturer, covering mechanical setup through customer operator training.',
        body: 'Full-day shadowing session during BSTA 410 commissioning at new EV battery connector customer. Session covered site preparation checks, machine levelling, servo feeder calibration, die installation, tonnage verification, first-off trial runs, and operator training handover. Junior engineer performed the servo feeder calibration under supervision and led the operator training session.',
        author: 'Service Supervisor',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA-410',
        system: 'Full press system',
        task: 'Press commissioning',
        symptom: 'New installation',
        environment: 'Customer site - EV connector manufacturer, Midlands',
        tags: ['shadowing', 'commissioning', 'BSTA-410', 'operator-training', 'EV-sector'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-05'),
        createdAt: new Date('2026-02-18'),
        typePayload: {
          seniorTechnician: 'Senior Field Engineer',
          juniorTechnician: 'Field Technician',
          competencyScore: 4,
          sessionOutcome: 'Junior completed servo feeder calibration independently with correct alignment within spec (±0.02mm). Led 45-minute operator training session confidently. Needs more experience with tonnage verification on larger presses - understood the theory but was hesitant on interpreting load cell readings at the upper range. Recommend they lead next BSTA 410 commissioning with senior engineer on standby.'
        }
      },
      {
        id: 'kr_proc_002',
        type: 'PROCEDURE',
        title: 'Approved method: BSTA press bearing clearance inspection and adjustment',
        summary: 'Standard procedure for measuring and adjusting ram bearing clearances on BSTA series presses during scheduled service visits.',
        body: 'Bearing clearance inspection is the single most important measurement during any BSTA service visit. The unique lever system relies on minimal clearances to maintain the precision that OEM presses are known for. This procedure applies to BSTA 200 through BSTA 810 models. Larger models (1250, 1600, 2500) follow similar principles but have additional measurement points - refer to model-specific supplement.',
        author: 'Senior Field Engineer',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA-510',
        system: 'Ram and lever mechanism',
        task: 'Bearing clearance inspection',
        symptom: 'Scheduled inspection',
        environment: 'Customer site - General',
        scope: 'GENERIC',
        tags: ['approved-method', 'bearing-clearance', 'inspection', 'BSTA-range', 'critical'],
        currentVersion: 2,
        lastValidatedAt: new Date('2026-03-01'),
        createdAt: new Date('2025-10-15'),
        typePayload: {
          steps: [
            'Position ram at BDC and isolate press. Fit dial indicator gauges at four measurement points: front-left, front-right, rear-left, rear-right of ram.',
            'Record initial clearance readings at all four points. Compare against model-specific factory specification (see OEM service manual chapter 4).',
            'Maximum allowable clearance for BSTA 200-810: 0.015mm per side. Any reading above 0.012mm should be flagged for adjustment.',
            'To adjust: loosen the bearing cap retaining bolts in the sequence specified in the service manual (always cross-pattern, never sequential).',
            'Insert OEM precision shims (part no. BRU-SHIM-SET) to bring clearance within 0.003-0.008mm range. Use calibrated feeler gauges to verify.',
            'Torque bearing cap bolts to model-specific torque values (BSTA 510: 185Nm, BSTA 810: 240Nm). Use calibrated torque wrench only.',
            'Rotate crankshaft by hand through one full revolution. Clearance readings should remain consistent ±0.001mm through full rotation.',
            'Run press in inching mode for 20 strokes. Re-check all four clearance points. If readings have shifted, repeat adjustment.',
            'Document all before/after readings on OEM service report. Flag any readings approaching upper tolerance for reduced service interval.'
          ]
        }
      },
      {
        id: 'kr_note_002',
        type: 'FIELD_NOTE',
        title: 'Field note: coil handling unit vibration on BSTA 1250 high-tonnage line',
        summary: 'Excessive vibration in decoiler unit traced to floor mounting issue, not equipment fault. Important site preparation lesson.',
        body: 'Called to a medical device stamper running a BSTA 1250 with integrated OEM decoiler. Customer reported vibration in the coil handling unit causing strip tension variation. Initial assumption was decoiler bearing wear, but investigation revealed the issue was foundation-related.',
        author: 'Field Technician',
        reviewer: 'Technical Reviewer',
        approvalState: 'DRAFT',
        confidence: 'MEDIUM',
        asset: 'BSTA-1250',
        system: 'Coil handling',
        task: 'Vibration diagnosis',
        symptom: 'Decoiler vibration and strip tension variation',
        environment: 'Customer site - Medical device manufacturer, Cambridge',
        tags: ['field-observation', 'coil-handling', 'vibration', 'foundation', 'BSTA-1250'],
        currentVersion: 1,
        createdAt: new Date('2026-03-08'),
        typePayload: {
          observation: 'Decoiler vibration was not originating from the unit itself. Floor-mounted accelerometer showed the concrete pad under the decoiler had developed a crack, creating a resonance at the press operating frequency (650 spm). The BSTA 1250 generates significant dynamic force that the original floor specification was marginal for. Vibration amplitude was 0.8mm at the decoiler base vs 0.1mm at the press base - confirming the floor was the issue.',
          immediateAction: 'Recommended customer engage structural engineer to assess foundation. Provided OEM floor specification document (BRU-INST-FLOOR-1250) showing minimum 300mm reinforced concrete pad requirement for BSTA 1250. Reduced stroke rate to 500 spm as interim measure to bring vibration within acceptable limits. Arranged follow-up visit for after foundation repair.'
        }
      },
      {
        id: 'kr_fail_002',
        type: 'FAILURE_PATTERN',
        title: 'Failure pattern: press monitoring false alarms on BSTA 200 running thin copper strip',
        summary: 'Pattern of false tonnage alarms on BSTA 200 presses running thin copper alloy strip (<0.2mm) at high speed for electronics connectors.',
        body: 'Multiple BSTA 200 customers in the electronics connector sector reporting frequent tonnage monitor false alarms when running thin copper alloy strip (0.1-0.2mm thickness) at speeds above 1,500 spm. The alarms trigger emergency stops that disrupt production and cause operator frustration. Pattern consistent across four different customer sites.',
        author: 'Senior Field Engineer',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA-200',
        system: 'Press monitoring',
        task: 'Tonnage monitor calibration',
        symptom: 'False tonnage alarms at high speed on thin strip',
        environment: 'Customer site - Electronics connector sector',
        tags: ['failure-pattern', 'press-monitoring', 'false-alarm', 'thin-strip', 'BSTA-200', 'high-speed'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-02-28'),
        createdAt: new Date('2025-12-12'),
        typePayload: {
          patternSignals: [
            'False tonnage alarms occurring 3-8 times per shift on thin strip (<0.2mm) above 1,500 spm',
            'Alarms always on the low-force side - monitor interpreting fast return stroke as under-tonnage',
            'No alarm events on same press running thicker strip (>0.3mm) at same speed',
            'Oscilloscope trace of load cell signal shows genuine force signature buried in high-frequency noise at top speed'
          ],
          likelyCauses: [
            'Default tonnage monitor sampling rate too slow for the force pulse width at maximum speed on thin strip - signal is being aliased',
            'Low-pass filter threshold on the monitoring unit set for general-purpose applications, not optimised for high-speed thin-strip work',
            'Solution: adjust monitoring unit filter frequency from 2kHz to 5kHz (OEM service parameter M-217) and reduce sampling window from 8ms to 3ms (parameter M-218). Requires factory-level access code.'
          ]
        }
      },
      {
        id: 'kr_proc_003',
        type: 'PROCEDURE',
        title: 'Approved method: BSTA press machine relocation - site preparation and re-levelling',
        summary: 'Complete procedure for press relocation including disconnection, transport preparation, site readiness checks, and precision re-levelling.',
        body: 'Machine relocations are a key service offering. This procedure covers the critical steps for safely relocating any BSTA press and ensuring it is returned to factory-level precision at the new site. A poorly executed relocation can take weeks to recover from. This procedure has been refined through over 200 successful relocations across the UK.',
        author: 'Senior Field Engineer',
        reviewer: 'Technical Reviewer',
        approvalState: 'UNDER_REVIEW',
        confidence: 'HIGH',
        asset: 'BSTA-510',
        system: 'Full press system',
        task: 'Machine relocation',
        symptom: 'Planned relocation',
        environment: 'Customer site - General',
        scope: 'GENERIC',
        tags: ['approved-method', 'relocation', 'levelling', 'site-preparation', 'commissioning'],
        currentVersion: 1,
        createdAt: new Date('2026-03-06'),
        typePayload: {
          steps: [
            'Pre-move survey: verify new site floor specification meets OEM requirements (min 200mm reinforced concrete for BSTA 200-510, 300mm for BSTA 710+). Check crane access, power supply spec, and compressed air availability.',
            'At existing site: run press and record baseline measurements - bearing clearances, ram parallelism, tonnage signature, and vibration profile. These are your target values for the new site.',
            'Disconnect all services: electrical (photograph all connections before disconnecting), pneumatic, lubrication, and monitoring systems. Secure all loose components and drain lubrication system.',
            'Fit transit locks to ram and crankshaft per OEM transport specification. Protect slide guides with corrosion inhibitor and wrap exposed surfaces.',
            'At new site: position press on anti-vibration mounts per OEM layout drawing. Level press bed to within 0.02mm/metre using precision spirit level.',
            'Reconnect all services. Refill lubrication system and run pump for 10 cycles before first start.',
            'Run press in inching mode. Measure bearing clearances and ram parallelism - compare to pre-move baseline. Adjust as needed to match or better pre-move readings.',
            'Perform full tonnage verification with calibrated load cells. Compare to pre-move signature. Maximum allowable deviation: 2% of nominal force.',
            'Run 1-hour production trial at customer operating parameters. Verify part quality matches pre-move standard. Sign off relocation report with customer.'
          ]
        }
      },
      {
        id: 'kr_proc_004',
        type: 'PROCEDURE',
        scope: 'GENERIC',
        title: 'OEM BSTA fault-finding walkthrough (B-Control, sensors, mechanical tolerances)',
        summary: 'Standard diagnostic sequence for BSTA high-speed stamping presses. Start here on every call-out. Covers B-Control IPC, eddy-current sensors, lubrication checks, and critical tolerances from official OEM publications.',
        body: [
          '# OEM BSTA Fault-Finding Walkthrough',
          '',
          '## Step 1: B-Control / IPC Screen (30 seconds)',
          '- Open the touch-screen control. Check error archive + live press-force / position monitoring.',
          '- Look for: tool monitoring alarms, BDC deviation, temperature alerts.',
          '',
          '## Step 2: Electronics and Sensors',
          '- Press-force sensors (2x standard) - compare to expected tonnage.',
          '- Eddy-current sensors in the die - measure actual insertion depth at BDC.',
          '  Source: "With the analogue SKILLSPONGE ram position control, the distance is measured by means of eddy current sensors, which are located in the die." (STAMPER magazine 2/06)',
          '',
          '## Step 3: PLC / Control Quick Checks',
          '- 24 VDC supply, Ethernet to peripherals, I/O status on screen.',
          '- Cycle power only if CPU error (rare).',
          '',
          '## Step 4: Lubrication (MOST COMMON ROOT CAUSE)',
          '- Pressure and flow on screen + visual leak check.',
          '- Low oil = instant bearing/gear wear risk. Check reservoir, filters, and distribution points.',
          '',
          '## Step 5: Clutch/Brake and Mechanical',
          '- Air pressure, linkage, gap.',
          '- Vibration - check mass-balancing and tie-rods.',
          '',
          '## Step 6: Run and Handover',
          '- Single stroke in setup mode - watch live ram correction.',
          '- Document findings before leaving site.',
          '',
          '## Critical Tolerances (from official OEM publications)',
          '- Dynamic ram height adjustment during stamping: +/-5 um',
          '  Source: "Thanks to the hardened and ground spindles, it is possible to adjust the ram height by +/- 5 um during the stamping process" (Fraunhofer IWU Workshop 2024, OEM presentation)',
          '- Typical ram adjustment resolution: 10 um (up to 2000 spm / 2500 kN)',
          '- Minimum ram adjustment (optional on BSTA 200/280/510): 2 um',
          '- Guide clearance: backlash-free at strip level',
          '',
          '## Common Failures',
          '- Lubrication failure - overheating and vibration',
          '- Ram BDC out of tolerance - bad parts (correct with eddy-current feedback)',
          '- Clutch slip at high spm',
          '- Sensor fault - auto-stop'
        ].join('\n'),
        author: 'Senior Field Engineer',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA Series (all models)',
        system: 'Ram and guides / Clutch and brake / Lubrication / IPC control',
        task: 'Fault diagnosis and repair',
        symptom: 'Any downtime (lubrication failure, ram misalignment, clutch slip, vibration)',
        environment: 'High-speed stamping production - all sites',
        tags: ['approved-method', 'fault-finding', 'bsta', 'b-control', 'eddy-current', 'ram-correction', 'tolerances', 'diagnostics'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Start at B-Control error archive - check for recent alarms and fault codes',
            'Verify eddy-current sensor readings in the die - confirm BDC depth is within tolerance',
            'Check lubrication system pressure and flow - most common root cause of mechanical faults',
            'Inspect clutch/brake air pressure, linkage and gap',
            'Check mass-balancing and tie-rod condition if vibration is reported',
            'Run single stroke in setup mode - observe motorised ram correction in real time',
            'Run stamping trial at target spm and verify part quality'
          ],
          tolerances: {
            ramAdjustment: '+/-5 um during stamping (source: Fraunhofer IWU 2024 OEM presentation)',
            typicalResolution: '10 um',
            minimumOption: '2 um (optional on BSTA 200/280/510)',
            guideClearance: 'Backlash-free at strip level',
            bdcControl: 'Maintained via press-force + eddy-current sensors in die'
          },
          commonFailures: [
            'Lubrication failure - overheating',
            'Ram BDC out of tolerance - bad parts',
            'Clutch slip at high spm',
            'Sensor fault - auto-stop'
          ],
          publicSources: [
            'Fraunhofer IWU Workshop 2024 - OEM presentation on precision stamping',
            'STAMPER magazine 2/06 - eddy-current sensor technology',
            'STAMPER magazine 1/17 - 2 um precision option'
          ]
        }
      },
      {
        id: 'kr_proc_005',
        type: 'PROCEDURE',
        scope: 'GENERIC',
        title: 'Approved method: pre-visit site checklist for BSTA service calls',
        summary: 'Standard preparation checklist before travelling to any customer site for scheduled service, breakdown, or commissioning work.',
        body: 'This checklist ensures every field service visit starts with the right information, tools, and parts. Completing it before leaving the Telford base or home avoids wasted journeys and delays on site. Applies to all visit types: scheduled service, breakdown response, commissioning, and relocation.',
        author: 'Service Supervisor',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA Series (all models)',
        system: 'Full press system',
        task: 'Pre-visit preparation',
        symptom: 'All visit types',
        environment: 'Telford base / home / en route',
        tags: ['approved-method', 'pre-visit', 'checklist', 'preparation', 'site-visit'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-12'),
        createdAt: new Date('2026-03-12'),
        typePayload: {
          steps: [
            'Confirm customer details: site address, contact name, phone number, access arrangements (security, PPE requirements, parking)',
            'Check machine details: model number, serial number, approximate running hours, last service date. Pull previous service reports from database.',
            'Review reported fault or service scope: what symptoms are they seeing? When did it start? Has anything changed recently (new tooling, speed change, relocation)?',
            'Check parts availability: verify required spares are in the van or order from Telford stock. Common items: lubrication filters, shim sets, seals, encoder mounts.',
            'Tool check: calibrated torque wrench (in date?), feeler gauge set, dial indicators, multimeter, thermal camera if available, laptop with B-Control software.',
            'Documentation: blank service report forms, model-specific service manual (digital or printed), relevant approved methods from SkillSponge.',
            'Travel and logistics: estimated travel time, expected duration on site, accommodation needed for multi-day jobs? Inform customer of ETA.',
            'Safety: site-specific risk assessment reviewed, LOTO locks packed, PPE appropriate for customer site (safety boots, hi-vis, ear defenders, safety glasses).',
            'Handover: if this is a machine you have not visited before, check SkillSponge for any site-specific notes, field observations, or previous failure patterns for this serial number.'
          ]
        }
      },
      {
        id: 'kr_fail_003',
        type: 'FAILURE_PATTERN',
        title: 'Failure pattern: clutch slip on BSTA 410 at high stroke rates during summer months',
        summary: 'Intermittent clutch slip causing missed strokes on BSTA 410 presses running above 1,200 spm when ambient temperature exceeds 30°C.',
        body: 'Pattern seen at two customer sites running BSTA 410 presses in non-air-conditioned press shops during summer. Clutch begins slipping intermittently after 3-4 hours of continuous running at high speed, causing missed strokes and emergency stops. Issue resolves when ambient temperature drops below 28°C.',
        author: 'Senior Field Engineer',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA-410',
        system: 'Clutch and brake',
        task: 'Clutch slip diagnosis',
        symptom: 'Intermittent missed strokes at high speed in warm conditions',
        environment: 'Customer site - Non-air-conditioned press shops',
        tags: ['failure-pattern', 'clutch', 'temperature', 'BSTA-410', 'seasonal'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-11'),
        createdAt: new Date('2026-01-20'),
        typePayload: {
          patternSignals: [
            'Missed strokes occurring after 3-4 hours of continuous running above 1,200 spm',
            'Only occurs when ambient temperature exceeds 30°C',
            'Clutch air pressure reads normal on gauge but response time is degraded',
            'Friction surface temperature measured at 85°C+ (normal operating range is 40-60°C)'
          ],
          likelyCauses: [
            'Clutch friction material losing grip coefficient at elevated temperature - material rated for max 75°C continuous',
            'Compressed air supply temperature rising in hot press shop - warmer air delivers less effective clamping force at same pressure',
            'Solution: increase air supply pressure by 0.5 bar during summer months (within safe operating range) and install air dryer on supply line to reduce moisture content. Long-term: recommend customer install localised cooling for the clutch/brake assembly.'
          ]
        }
      },
      {
        id: 'kr_fail_004',
        type: 'FAILURE_PATTERN',
        title: 'Failure pattern: progressive die misalignment on BSTA 510 after tooling change',
        summary: 'Recurring die misalignment issue after tool changeover on BSTA 510 presses. Root cause traced to inconsistent die clamping sequence.',
        body: 'Pattern seen at three BSTA 510 customer sites where operators are performing their own die changes. Parts quality degrades within the first 500 strokes after a tool change, showing progressive off-centre hits. Issue does not occur when OEM-trained setters perform the changeover.',
        author: 'Senior Field Engineer',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA-510',
        system: 'Die alignment',
        task: 'Die changeover diagnosis',
        symptom: 'Progressive off-centre hits after tool change',
        environment: 'Customer site - Various',
        tags: ['failure-pattern', 'die-alignment', 'tool-change', 'BSTA-510', 'operator-training'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-08'),
        createdAt: new Date('2026-02-01'),
        typePayload: {
          patternSignals: [
            'Parts show progressive off-centre hit pattern within first 500 strokes after tool change',
            'Issue worsens with increasing stroke rate',
            'Die appears correctly seated on visual inspection but is micro-shifted under dynamic load',
            'Problem only occurs with operator-performed changeovers, not OEM-trained setter changeovers'
          ],
          likelyCauses: [
            'Operators tightening die clamps in sequential order instead of cross-pattern - creates uneven clamping force that allows micro-movement under dynamic load',
            'Die locating pins not fully engaged before clamping - operators pushing die into approximate position rather than letting pins locate precisely',
            'Solution: operator retraining on OEM die changeover procedure. Key point: always cross-pattern tighten clamps, verify locating pin engagement with 0.02mm feeler gauge, and run 50 slow strokes before production speed. Consider installing die presence sensors for positive confirmation.'
          ]
        }
      },
      {
        id: 'kr_fail_005',
        type: 'FAILURE_PATTERN',
        title: 'Failure pattern: servo feed encoder failure after coolant contamination',
        summary: 'Servo feed encoder failures on BSTA presses in environments where cutting coolant mist is present. Encoder seal degradation leads to signal loss.',
        body: 'Three encoder failures in 6 months across two customer sites where BSTA presses are installed adjacent to CNC machining centres. Coolant mist from nearby machines is contaminating the servo feed encoder, degrading the seal and causing intermittent signal loss that presents as random feed length errors.',
        author: 'Field Technician',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'MEDIUM',
        asset: 'BSTA-280',
        system: 'Servo feed',
        task: 'Encoder fault diagnosis',
        symptom: 'Random feed length errors, encoder signal loss',
        environment: 'Customer site - Mixed press/CNC environment',
        tags: ['failure-pattern', 'servo-feed', 'encoder', 'contamination', 'coolant', 'environment'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-09'),
        createdAt: new Date('2026-02-10'),
        typePayload: {
          patternSignals: [
            'Random feed length errors appearing 2-3 times per shift',
            'Errors not speed-dependent (unlike thermal drift pattern)',
            'Encoder signal trace shows intermittent dropouts rather than drift',
            'Visual inspection shows coolant residue around encoder housing seal',
            'Sites have CNC machining centres within 5 metres of the press'
          ],
          likelyCauses: [
            'Coolant mist from adjacent CNC machines penetrating encoder seal - standard IP54 seal not rated for continuous mist exposure',
            'Coolant chemistry (water-soluble type) accelerates seal degradation compared to oil-based coolants',
            'Solution: fit IP67-rated encoder cover (OEM retrofit kit BRU-SRV-ENC-IP67) and install mist extraction or physical barrier between press and CNC machines. Preventive: add encoder seal inspection to 6-monthly service checklist for sites with mixed press/CNC environments.'
          ]
        }
      }
    ]
  });

  // ── Bruderer technical procedures (from official specs and patents) ──
  await prisma.knowledgeRecord.createMany({
    data: [
      // ═══ GENERIC PROCEDURES (all BSTA/BSTL models) ═══
      {
        id: 'kr_bru_gen_001',
        type: 'PROCEDURE',
        scope: 'GENERIC',
        title: 'Bruderer lever system: core drive mechanism operating principles',
        summary: 'Detailed process description of the patented Bruderer lever system — power transmission from the short torsional-rigid transverse main shaft through connecting rods, lever mechanism, and push rods to the ram.',
        body: 'The Bruderer lever system is the defining technology across all BSTA and BSTL series presses. Power transmits from a short, torsionally rigid transverse main shaft via two connecting rods through the lever mechanism and push rods to the ram. Each spindle handles only approximately 20% of the total ram load, minimising deflection under eccentric loads. The lever geometry distributes the remaining load through the frame structure. Mass counterbalancing adapts automatically to stroke changes, enabling vibration-free operation at high speeds. This process covers inspection, verification, and understanding of the lever system for service engineers.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA Series (all models)',
        system: 'Ram and lever mechanism',
        task: 'Lever system inspection and verification',
        symptom: 'Technical reference / scheduled inspection',
        environment: 'Workshop or customer site',
        tags: ['lever-system', 'drive-mechanism', 'patented', 'core-technology', 'generic', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Verify press is isolated and locked out. Confirm ram at BDC before any inspection of the lever system.',
            'Identify the main shaft: short, torsionally rigid transverse shaft running across the press width. On BSTA models this shaft is hardened and ground to micron-level tolerances.',
            'Trace the power path: main shaft → two connecting rods → lever mechanism → push rods → ram. The lever geometry means each spindle carries only ~20% of total ram load. The remaining 80% is distributed through the frame via the lever arms.',
            'Inspect connecting rod big-end bearings for play. Target clearance: 0.003–0.008 mm per side. Maximum allowable: 0.015 mm per side. Use calibrated feeler gauges at four points (N/S/E/W).',
            'Check push rod alignment. Push rods must be concentric with ram guide bores. Misalignment indicates lever pivot wear or foundation settlement.',
            'Verify mass counterbalancing system: the counterbalance automatically adapts when stroke length changes. Run press through two different stroke settings (if adjustable) and confirm vibration remains within spec using accelerometer at press crown.',
            'Inspect lever pivot pins and bushes for wear marks, discolouration, or scoring. These are hardened components — any visible wear indicates lubrication failure or excessive running hours.',
            'Measure ram parallelism at four corners using dial indicators mounted on the bolster. Maximum deviation: 0.005 mm across full tool area width.',
            'Document all measurements on the Bruderer service report form. Compare to factory acceptance data if available. Flag any reading exceeding 75% of maximum allowable tolerance for preventive action.'
          ]
        }
      },
      {
        id: 'kr_bru_gen_002',
        type: 'PROCEDURE',
        scope: 'GENERIC',
        title: 'Ram adjustment and BDC control: dynamic height adjustment during production',
        summary: 'Step-by-step operational workflow for Bruderer dynamic ram height adjustment during stamping, covering thermoneutral guiding, micro-tolerances (±5 µm standard / 2 µm option), press-force signal integration, and clutch/brake optimisation.',
        body: 'Bruderer presses feature dynamic ram height adjustment during production — the ram position is corrected in real time using press-force signals and eddy-current sensor feedback. Standard precision is ±5 µm, with a 2 µm option on BSTA 200/280/510. The ram is guided at strip level using thermoneutral principles: tilting point control via multi-row cylindrical roller bearings that are backlash-free, with thermal compensation built into the guide geometry. The clutch/brake unit is optimised for first/last strike quality.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA Series (all models)',
        system: 'Ram and lever mechanism',
        task: 'Ram height adjustment and BDC control',
        symptom: 'BDC deviation / part quality drift',
        environment: 'Workshop or customer site',
        tags: ['ram-adjustment', 'BDC-control', 'dynamic', 'micro-tolerance', 'thermoneutral', 'generic', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'On the B-Control IPC, navigate to Ram Adjustment screen. The current BDC position, adjustment range, and mode (manual / semi-automatic / automatic) are displayed.',
            'For semi-automatic mode: the system suggests corrections based on press-force envelope deviation. Operator confirms each adjustment. For automatic mode: corrections apply continuously without operator intervention.',
            'Verify eddy-current sensors are installed in the die. These measure actual insertion depth at BDC, enabling closed-loop ram position control. Sensor output should appear on B-Control under "BDC Position" — value in µm relative to nominal.',
            'Check thermoneutral ram guiding: the ram is guided at strip level (not at top or bottom of stroke) using multi-row cylindrical roller bearings. These bearings are backlash-free — verify by attempting to rock the ram side-to-side with press at BDC. Zero perceptible play is the target.',
            'Monitor thermal compensation: as press warms up (typically 30–60 min to thermal equilibrium), the ram position drifts. In automatic mode, the B-Control compensates in real time. Log the thermal drift curve on first commissioning for baseline reference.',
            'Verify adjustment resolution: standard is ±5 µm. If 2 µm option is fitted (BSTA 200/280/510 only), the B-Control display will show "Hi-Res" indicator. Test by commanding a +2 µm step and verifying the sensors confirm the change.',
            'Check clutch/brake unit: optimised first/last strikes depend on consistent clutch engagement. Verify air pressure is within spec (typically 5–6 bar). Check brake lining wear indicator on B-Control.',
            'Verify shutdown height (BDC position when press stops mid-stroke). This must not exceed the die clearance. Record the shutdown height value from B-Control diagnostics.',
            'Run a 15-minute production test. Monitor BDC deviation on B-Control — should remain within ±5 µm (or ±2 µm if Hi-Res fitted) throughout the run. Any exceedance triggers investigation of guide wear, thermal effects, or sensor calibration.'
          ]
        }
      },
      {
        id: 'kr_bru_gen_003',
        type: 'PROCEDURE',
        scope: 'GENERIC',
        title: 'B-Control / B3 IPC: control system monitoring and parameter workflow',
        summary: 'Step-by-step guide for using the Bruderer B-Control IPC-based touchscreen control system — process data visibility, envelope monitoring, press-force/position control, OPC-UA interface, EtherCAT bus, and tool library management.',
        body: 'The B-Control is the central interface for all Bruderer BSTA and BSTL presses. It provides real-time process data, envelope monitoring, press-force and position control, and connectivity to peripherals via OPC-UA and EtherCAT. The tool library stores up to 1,000 tool setups. This procedure covers the standard workflow for monitoring, configuring, and optimising press operation through the B-Control system.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA Series (all models)',
        system: 'B-Control / IPC',
        task: 'Control system setup and monitoring',
        symptom: 'System configuration / parameter optimisation',
        environment: 'Workshop or customer site',
        tags: ['b-control', 'IPC', 'monitoring', 'OPC-UA', 'EtherCAT', 'tool-library', 'generic', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Power on the B-Control IPC. The system boots to the main dashboard showing: current stroke rate (spm), press force (kN), ram position (µm from nominal BDC), active tool number, and system status indicators.',
            'Check the error archive: tap "Diagnostics" → "Error Archive". Review any logged alarms from previous production runs. Each entry shows timestamp, error code, press state at time of error, and recommended action.',
            'Configure envelope monitoring: tap "Monitoring" → "Press Force Envelope". The system displays the force curve across the full 360° stroke cycle — not just peak load at BDC. Set upper and lower envelopes based on the reference curve from tool tryout. Typical envelope width: ±10% of reference curve.',
            'Set up position monitoring: tap "Monitoring" → "Ram Position". Configure BDC deviation alarm threshold (default ±5 µm). Enable 4-input position monitoring to detect ram tilt and guide wear — this uses differential readings from sensors at four corners of the ram.',
            'Connect peripherals via OPC-UA: tap "System" → "Interfaces" → "OPC-UA". The B-Control acts as an OPC-UA server. Configure tags for export to MES/SCADA systems. Standard tags include: stroke count, force, speed, tool ID, and alarm state.',
            'Verify EtherCAT bus: tap "System" → "Interfaces" → "EtherCAT". All connected peripheral devices (servo feed, lubrication controller, coil handler) should appear in the device list with "Online" status. Any "Offline" device needs physical connection check.',
            'Manage the tool library: tap "Tools" → "Library". Up to 1,000 tool setups can be stored. Each setup includes: stroke length, speed range, feed length, force envelope, BDC target, and operator notes. To load a tool: select from library → confirm → press automatically adjusts all parameters.',
            'Configure strip lubrication integration (if BSS system fitted): tap "Peripherals" → "Lubrication". Configure nozzle pattern, oil quantity per stroke, and selective oiling zones. The B-Control synchronises lubrication pulses with press timing.',
            'Verify safety control: tap "Safety" → "Status". All safety circuits (light curtains, two-hand control, emergency stop chain) must show "OK". Any fault blocks press start. Review safety parameter checksums — these must match the last approved configuration.',
            'Export process data: tap "Data" → "Export". Select time range and parameters. Data exports to USB or network share in CSV format for quality analysis. Recommended: export shift data daily for OEE analysis via ShopFloorConnect.'
          ]
        }
      },
      {
        id: 'kr_bru_gen_004',
        type: 'PROCEDURE',
        scope: 'GENERIC',
        title: 'Energy efficiency and lubrication system: IE5 drive and recirculating pressure lubrication',
        summary: 'Process for verifying and maintaining the Bruderer energy efficiency systems including IE5 synchronous drive, friction reduction features, and recirculating pressure lubrication with heat exchanger.',
        body: 'Bruderer BSTA and BSTL presses feature an IE5 ultra-premium efficiency synchronous drive motor, optimised friction reduction through the lever mechanism, and a recirculating pressure lubrication system with integrated heat exchanger. These systems work together to minimise energy consumption while maintaining precision. ISO VG 68 grade oil is standard. Annual flush is recommended. Low oil pressure is the most common root cause of mechanical faults on BSTA presses.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA Series (all models)',
        system: 'Lubrication',
        task: 'Lubrication system and energy efficiency check',
        symptom: 'Scheduled maintenance / efficiency audit',
        environment: 'Workshop or customer site',
        tags: ['IE5-drive', 'lubrication', 'heat-exchanger', 'energy-efficiency', 'ISO-VG-68', 'generic', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Verify drive motor specification: IE5 ultra-premium efficiency synchronous motor. Check nameplate data matches the press model specification. Record motor current draw at idle and at rated spm — compare to commissioning baseline.',
            'Inspect the recirculating pressure lubrication system: check reservoir oil level via sight glass. Oil must be ISO VG 68 grade. Check oil colour — fresh oil is amber; dark brown/black indicates contamination or overdue change.',
            'Verify heat exchanger operation: the heat exchanger maintains oil temperature within operating range (typically 35–55°C). Check inlet and outlet temperatures on the B-Control lubrication screen. ΔT should be 5–15°C depending on press load.',
            'Check oil pressure on B-Control: navigate to "Diagnostics" → "Lubrication". Normal operating pressure varies by model but is typically 2–4 bar. Low oil pressure alarm threshold is factory-set — do not adjust without Bruderer authorisation.',
            'Inspect all lubrication distribution points: each bearing, guide, and gear mesh point has a dedicated supply line. Check for blocked nozzles, leaking fittings, or dry contact surfaces. A single blocked nozzle can cause localised bearing failure.',
            'Run the central lubrication pump manually for 5 cycles: verify oil reaches all distribution points. Use UV-dye test if flow confirmation is difficult at remote points.',
            'Check the lubrication filter condition: filters should be changed annually or when the differential pressure alarm triggers on B-Control. Record filter condition (clean / partially blocked / replaced).',
            'Measure friction at low speed: run press at minimum spm with no tool fitted. Record motor current — this represents friction losses. Compare to commissioning baseline. An increase >15% indicates bearing wear or lubrication degradation.',
            'Perform annual oil flush if due: drain full system, flush with Bruderer-approved flushing agent (BRU-LUB-FLUSH-01) for 15 minutes, drain flush, refill with fresh ISO VG 68. Record on service report.',
            'Log all readings in the press maintenance record. Flag any parameter exceeding 80% of alarm threshold for early intervention at next scheduled visit.'
          ]
        }
      },
      {
        id: 'kr_bru_gen_005',
        type: 'PROCEDURE',
        scope: 'GENERIC',
        title: 'Feed and peripheral integration: BBV mechanical and BSV servo feed setup',
        summary: 'Procedure for setting up and synchronising Bruderer feed systems (BBV mechanical feed and BSV servo feed) with the press, including strip inlet parameters, peripheral attachment for turnkey lines.',
        body: 'Bruderer presses use either BBV mechanical feed or BSV servo feed systems. The BSV servo feed provides encoder-controlled precision at high speeds with programmable feed profiles. Feed synchronisation with press timing is critical for strip positioning accuracy. This procedure covers setup, calibration, and integration of feed systems with decoilers, straighteners, and downstream peripherals to form turnkey stamping lines.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA Series (all models)',
        system: 'Servo feed',
        task: 'Feed system setup and synchronisation',
        symptom: 'New tool setup / feed accuracy issue',
        environment: 'Workshop or customer site',
        tags: ['servo-feed', 'BBV', 'BSV', 'synchronisation', 'strip-handling', 'turnkey', 'generic', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Identify feed type: BBV (mechanical, gear-driven from press main shaft) or BSV (servo motor with encoder feedback). The feed type is shown on the B-Control main screen under "Feed System".',
            'For BSV servo feed — enter strip parameters on B-Control: strip width (mm), strip thickness (mm), feed length per stroke (mm), and feed timing window (degrees of press rotation during which feed is permitted).',
            'Set feed reference point: jog the strip to the correct position using the B-Control feed jog controls. Set this position as the reference. The servo encoder will maintain position accuracy relative to this point.',
            'Programme the feed profile (BSV only): for standard stamping, use "constant speed" profile. For complex progressive dies, programme acceleration/deceleration ramps to match die requirements. Feed profiles are stored in the tool library.',
            'Verify feed timing synchronisation: on B-Control, navigate to "Timing" → "Feed". The feed window must not overlap with the press working zone (the portion of the stroke where the tool contacts the strip). Overlap causes strip damage or tool crash.',
            'Calibrate feed length: run 10 test strokes at low speed. Measure actual feed length using a precision scale marked on the strip. Compare to programmed value. Adjust feed length compensation on B-Control if deviation exceeds ±0.05 mm.',
            'Set up decoiler: verify coil inner/outer diameter matches decoiler capacity. Set coil brake tension to prevent overrun. For heavy coils (>500 kg), verify decoiler foundation bolts are torqued to spec.',
            'Set up straightener: adjust straightener roller positions for strip thickness. Run strip through and check flatness with straight edge — deviation must not exceed 0.1 mm over 300 mm length.',
            'Connect peripherals to B-Control via EtherCAT: decoiler, straightener, and any downstream equipment (rewind, parts conveyor) should appear in the EtherCAT device list. Verify "Online" status for each.',
            'Run full-speed integration test: start at 50% rated spm, verify feed accuracy, strip tracking, and peripheral synchronisation. Gradually increase to target spm. Monitor feed deviation on B-Control — alarm if deviation exceeds programmed tolerance.',
            'Watch for thermal drift on encoder mounts above 1,200 spm. At high speeds, heat from the press can expand encoder mounting brackets, introducing position error. If feed accuracy degrades after thermal equilibrium, check encoder mount temperature and apply thermal offset correction on B-Control.'
          ]
        }
      },
      {
        id: 'kr_bru_gen_006',
        type: 'PROCEDURE',
        scope: 'GENERIC',
        title: 'Clutch and brake system: inspection, adjustment, and first/last strike optimisation',
        summary: 'Inspection and adjustment procedure for the Bruderer pneumatic clutch/brake system covering air pressure, linkage wear, gap measurement, friction surface condition, and first/last strike quality verification.',
        body: 'The Bruderer pneumatic clutch/brake system controls press engagement and stopping. Clutch slip at high spm indicates worn friction surfaces. The system is optimised for consistent first-strike and last-strike quality — critical for progressive die stamping where every stroke must produce identical parts. This procedure covers the complete inspection and adjustment process.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA Series (all models)',
        system: 'Clutch and brake',
        task: 'Clutch/brake inspection and adjustment',
        symptom: 'Clutch slip / inconsistent stopping / first-strike deviation',
        environment: 'Workshop or customer site',
        tags: ['clutch', 'brake', 'pneumatic', 'first-strike', 'friction', 'generic', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Verify compressed air supply: operating pressure must be 5–6 bar at the press connection point. Check with calibrated gauge at the press inlet — not at the compressor. Pressure drop in supply lines can cause intermittent clutch problems.',
            'Inspect the clutch friction surfaces: access via the clutch cover (press must be isolated and locked out). Look for glazing, scoring, oil contamination, or material loss. Minimum friction material thickness is specified per model in the service manual.',
            'Measure clutch air gap: use feeler gauges at four equally spaced points around the clutch. Gap must be uniform within 0.05 mm. Uneven gap causes vibration and premature wear.',
            'Check brake lining condition: similar inspection to clutch. Brake linings typically wear faster than clutch surfaces due to deceleration loads. Replace both sides simultaneously to maintain balance.',
            'Verify clutch engagement timing: on B-Control, navigate to "Diagnostics" → "Clutch/Brake". The engagement time (ms) and engagement angle (degrees) are displayed. Compare to factory specification for the model and spm setting.',
            'Test first-strike quality: load a tool, run a single stroke at rated speed. Remove the part and inspect against quality standard. The first strike should produce a part within tolerance — any deviation indicates clutch engagement inconsistency.',
            'Test last-strike quality: run at rated speed, command stop. Remove the last part produced. This part should be within tolerance — poor last-strike quality indicates brake timing drift.',
            'Check linkage and pivot points: all mechanical linkages in the clutch/brake actuation chain must be free of play. Check for worn pins, bushes, and clevis joints. Lubricate per Bruderer schedule.',
            'Verify the B-Control clutch monitoring parameters: slip detection threshold, overrun alarm angle, and brake response time must match the approved configuration for the installed tool and spm setting.',
            'Record all measurements. Clutch/brake wear is gradual — trending over multiple service visits is more valuable than single readings. Flag any measurement that has changed by more than 20% since last visit.'
          ]
        }
      },
      {
        id: 'kr_bru_gen_007',
        type: 'PROCEDURE',
        scope: 'GENERIC',
        title: 'Press force envelope monitoring: setup, calibration, and alarm configuration',
        summary: 'Procedure for configuring and calibrating the Bruderer press force monitoring system including sensor validation, dynamic envelope curve setup across the full stroke cycle, and alarm threshold configuration.',
        body: 'Bruderer press force monitoring uses 2x or 4x load channels for tonnage measurement. The system performs dynamic envelope curve monitoring across the full 360° stroke cycle — not just peak load at BDC. This provides early detection of tool wear, strip variation, and mechanical faults before they cause part quality issues or press damage.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA Series (all models)',
        system: 'Press monitoring',
        task: 'Force envelope monitoring setup',
        symptom: 'Tool setup / quality monitoring configuration',
        environment: 'Workshop or customer site',
        tags: ['press-force', 'envelope', 'monitoring', 'calibration', 'load-cell', 'generic', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Verify sensor installation: standard configuration is 2x press force sensors (left and right of bolster). Premium configuration adds 2x more for 4-channel monitoring. Check each sensor cable connection and verify signal on B-Control.',
            'Calibrate sensors: on B-Control, navigate to "Monitoring" → "Calibration". Follow the guided calibration sequence. The system applies a known load via hydraulic cylinders and records sensor output. Calibration is required annually or after sensor replacement.',
            'Capture reference curve: run the press with the production tool at rated spm for 50 strokes. The B-Control records the average force curve across 360° of stroke rotation. This becomes the reference envelope.',
            'Set envelope tolerances: default is ±10% of reference curve at each degree of rotation. For precision work, tighten to ±5%. For heavy stamping with material variation, widen to ±15%. The B-Control allows different tolerances at different regions of the curve.',
            'Configure alarm actions: "Warning" = log event and display alert (production continues). "Stop" = immediate press stop. Configure "Stop" for any exceedance >20% of reference, and "Warning" for exceedance between tolerance and 20%.',
            'Set up BDC force monitoring separately: the force at BDC (bottom dead centre) is the critical value for part quality. Set a dedicated BDC force window with tighter tolerance (typically ±3% of reference).',
            'Enable ram tilt detection (4-channel systems only): the system compares left-side to right-side force channels. A differential exceeding threshold indicates ram tilt, uneven die loading, or guide wear. Set alarm at 5% differential.',
            'Verify tool monitoring channels: up to 12 separate analogue tool channels (PSA sensors) can be configured. These detect individual station forces within progressive dies. Set up per station from B-Control "Tools" → "Station Monitoring".',
            'Configure digital I/O: up to 24 digital inputs/CAM outputs. These trigger peripheral actions (parts ejection, quality gate diversion) based on force monitoring results.',
            'Save configuration to tool library: all monitoring parameters are stored with the tool setup. When the tool is loaded next time, all parameters restore automatically.'
          ]
        }
      },

      // ═══ MODEL-SPECIFIC PROCEDURES ═══
      {
        id: 'kr_bru_mod_001',
        type: 'PROCEDURE',
        scope: 'MODEL_SPECIFIC',
        title: 'BSTA 200: high-speed setup and optimisation (up to 2,000/2,300 spm)',
        summary: 'Model-specific procedure for the BSTA 200 covering high-speed operation up to 2,000 spm (2,300 spm optional), adjustable stroke configuration, and speed-dependent parameter tuning.',
        body: 'The BSTA 200 is the highest-speed model in the Bruderer range: 200 kN (20 ton) press force, up to 2,000 spm standard (2,300 spm optional). Tool area 600–700 mm. Adjustable stroke range 8–32 mm. Ram adjustment ±5 µm standard, 2 µm option. At these speeds, thermal management, feed synchronisation, and vibration control are critical. This procedure covers the model-specific setup and optimisation steps.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA-200',
        system: 'Full press system',
        task: 'High-speed setup and optimisation',
        symptom: 'New tool commissioning / speed optimisation',
        environment: 'Customer site',
        tags: ['BSTA-200', 'high-speed', '2000-spm', 'model-specific', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Confirm press specification: BSTA 200, 200 kN, serial number, and installed options (standard 2,000 spm or optional 2,300 spm package, 2 µm ram adjustment option).',
            'Set stroke length: adjustable from 8–32 mm. Select stroke on B-Control. The mass counterbalancing system adapts automatically — verify by checking vibration level on the B-Control dashboard after stroke change.',
            'Configure speed ramp-up: at speeds above 1,500 spm, ramp gradually. Programme B-Control for: 500 spm → 1,000 spm → 1,500 spm → target speed, with 60-second dwell at each stage for thermal stabilisation.',
            'Monitor thermal drift during warm-up: the BSTA 200 reaches thermal equilibrium in approximately 20–30 minutes at rated speed. Enable automatic BDC compensation on B-Control. Log thermal drift curve during first warm-up with new tool.',
            'Verify feed synchronisation at target speed: the BSV servo feed must complete its stroke within the feed window. At 2,000 spm, the total cycle time is 30 ms — the feed window is typically 40–60% of this. Any timing conflict triggers press stop.',
            'Check encoder mount temperature: above 1,200 spm, thermal expansion of encoder mounting brackets can introduce feed position error. If feed accuracy degrades after thermal equilibrium, apply thermal offset correction in B-Control feed parameters.',
            'Optimise lubrication for high speed: at >1,500 spm, increase lubrication pump cycle frequency from standard to "high-speed" setting on B-Control. Verify oil temperature remains below 55°C via heat exchanger.',
            'Verify vibration levels: use accelerometer at press crown and at foundation. At rated speed, vibration must remain below Bruderer specification (model-specific limits in service manual). Excessive vibration indicates counterbalance issue, foundation problem, or tool imbalance.',
            'Run production trial: start at 50% rated spm and increase in 200 spm increments to target. At each step, verify part quality, force envelope, and BDC stability. Record the minimum spm at which all quality criteria are met — this is the validated operating speed.',
            'Save all parameters to tool library. Include notes on validated speed, thermal drift characteristics, and any model-specific adjustments made.'
          ]
        }
      },
      {
        id: 'kr_bru_mod_002',
        type: 'PROCEDURE',
        scope: 'MODEL_SPECIFIC',
        title: 'BSTA 1250: heavy-tonnage ram adjustment and large-format die setup',
        summary: 'Model-specific procedure for the BSTA 1250 covering 1,250 kN operation, 89 mm ram adjustment range, large-format tool area (1,170–1,810 mm), and heavy-tonnage specific checks.',
        body: 'The BSTA 1250 is a heavy-tonnage high-performance press: 1,250 kN (125 ton) force, up to 850 spm, adjustable stroke 16–100 mm, 89 mm ram adjustment range. Tool area 1,170–1,810 mm. Weight approximately 25–30 tonnes. Foundation specification: minimum 300 mm reinforced concrete. At this tonnage and size, foundation integrity, crane access for die changes, and tonnage verification are critical additional considerations.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA-1250',
        system: 'Full press system',
        task: 'Heavy-tonnage setup and die change',
        symptom: 'Tool commissioning / die change',
        environment: 'Customer site',
        tags: ['BSTA-1250', 'heavy-tonnage', '125-ton', 'large-format', 'model-specific', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Confirm press specification: BSTA 1250, 1,250 kN, serial number. Note installed tool area variant (1,170 mm or 1,810 mm bolster).',
            'Pre-die-change checks: verify crane capacity exceeds die weight plus 20% safety margin. Check die clamping system hydraulic pressure. Ensure bolster T-slots are clean and undamaged.',
            'Ram adjustment range: the BSTA 1250 has 89 mm total ram adjustment range — the largest in the BSTA range. This allows use with a wide range of die shut heights. Set shut height on B-Control before die installation.',
            'Set stroke length: adjustable 16–100 mm. For strokes above 76 mm, verify that the mass counterbalancing system has adapted correctly — check vibration levels at low speed before ramping up.',
            'Install die: use hydraulic die clamping system. Verify die is centred on bolster using alignment pins. Torque all clamp bolts to specification in a cross pattern.',
            'Verify tonnage with calibrated load cells: run 10 test strokes. Compare measured force to programmed force on B-Control. Maximum allowable deviation: 2% of nominal (25 kN for the BSTA 1250).',
            'Check foundation condition: for presses of this weight (25–30 tonnes), foundation cracks, settlement, or vibration transmission to adjacent equipment are ongoing concerns. Visual inspect foundation annually. Re-level if settlement exceeds 0.02 mm/metre.',
            'Configure force envelope monitoring: with large-format dies, the force distribution across the bolster width is critical. Use 4-channel monitoring if available. Set differential alarm to detect uneven die loading.',
            'Verify coil handling equipment capacity: decoiler and straightener must be rated for the strip dimensions used in large-format dies. Foundation bolts on ancillary equipment must be checked — vibration from the 1,250 kN press transmits through the floor.',
            'Run at rated speed (up to 850 spm) only after all checks pass. Monitor for 30 minutes. Document all parameters in the press log.'
          ]
        }
      },
      {
        id: 'kr_bru_mod_003',
        type: 'PROCEDURE',
        scope: 'MODEL_SPECIFIC',
        title: 'BSTL 350: fixed-stroke IE5 press setup and OPC-UA commissioning',
        summary: 'Model-specific procedure for the BSTL 350-88 covering fixed stroke selection (15.9/19/25.4/31.8 mm), IE5 drive commissioning, OPC-UA/EtherCAT interface setup, and cyber security configuration.',
        body: 'The BSTL 350 is the latest generation Bruderer press: 350 kN (35 ton), 880 mm tool area, fixed strokes 15.9/19/25.4/31.8 mm, 100–1,200 spm, IE5 ultra-premium efficiency drive. Features standard OPC-UA universal interfaces, EtherCAT bus, and built-in cyber security features. This procedure covers setup and commissioning specific to the BSTL 350 platform.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTL-350',
        system: 'Full press system',
        task: 'BSTL 350 setup and commissioning',
        symptom: 'New installation / commissioning',
        environment: 'Customer site',
        tags: ['BSTL-350', 'fixed-stroke', 'IE5', 'OPC-UA', 'cyber-security', 'model-specific', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Confirm press specification: BSTL 350-88 (880 mm tool area), 350 kN, serial number. Note the installed fixed stroke option.',
            'Fixed stroke selection: the BSTL 350 offers four fixed stroke options — 15.9 mm, 19 mm, 25.4 mm, and 31.8 mm. Stroke change requires mechanical changeover (not adjustable during production). Follow the quick-change procedure in the BSTL service manual.',
            'Verify IE5 drive commissioning: check motor nameplate matches specification. Run at idle and record no-load current. Compare to factory test certificate. The IE5 motor should show measurably lower current draw than predecessor IE3/IE4 installations.',
            'Commission OPC-UA interface: the BSTL 350 has OPC-UA built in as standard (not optional). Connect to customer network. Configure security certificates per Bruderer cyber security guide. Set up tag mapping for MES/ERP integration.',
            'Configure EtherCAT bus: connect all peripherals (servo feed, lubrication, coil handling). Scan bus from B-Control. All devices must appear and sync within 5 seconds. If a device fails to sync, check cable routing — EtherCAT is sensitive to cable quality over >50m runs.',
            'Cyber security configuration: the BSTL 350 includes built-in security features. Set up user accounts with role-based access. Enable audit logging. Configure network firewall rules per Bruderer security bulletin. Change all default passwords from factory settings.',
            'Speed range verification: run through 100 spm to 1,200 spm range. At each 200 spm increment, verify force envelope, feed accuracy, and vibration. The BSTL 350 is designed for consistent performance across this full range.',
            'Validate press against acceptance criteria: run Bruderer standard acceptance test program (stored in B-Control). This tests parallelism, force accuracy, speed stability, and BDC repeatability across the full operating envelope.',
            'Complete commissioning documentation: record all parameters, test results, network configuration, and security settings. Provide customer with commissioning report and OPC-UA tag dictionary.'
          ]
        }
      },
      {
        id: 'kr_bru_mod_004',
        type: 'PROCEDURE',
        scope: 'MODEL_SPECIFIC',
        title: 'BSTA 510: servo feed calibration and mid-range press optimisation',
        summary: 'Model-specific procedure for BSTA 510 covering servo feed precision calibration, mid-range tonnage operation (510 kN), adjustable stroke 10–64 mm, and tool area configurations (950–1,500 mm).',
        body: 'The BSTA 510 is the workhorse of the Bruderer range: 510 kN (51 ton), up to 1,120 spm, adjustable stroke 10–64 mm, tool area 950–1,500 mm. Ram adjustment ±5 µm (2 µm option available). This is the most commonly encountered model in UK field service. This procedure covers model-specific calibration and optimisation.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA-510',
        system: 'Full press system',
        task: 'Mid-range press optimisation',
        symptom: 'Performance tuning / calibration',
        environment: 'Customer site',
        tags: ['BSTA-510', 'servo-feed', 'mid-range', '51-ton', 'model-specific', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Confirm specification: BSTA 510, 510 kN, serial number. Note installed options: tool area variant (950 mm, 1,200 mm, or 1,500 mm), 2 µm ram adjustment option, BPG 22 planetary gearbox option.',
            'Set adjustable stroke: range 10–64 mm. Select on B-Control. Verify mass counterbalance adaptation by checking vibration at low speed after any stroke change.',
            'Calibrate BSV servo feed: the BSTA 510 is typically fitted with BSV servo feed. Run the B-Control auto-calibration sequence for feed length, acceleration, and timing.',
            'Verify 2 µm ram adjustment (if fitted): on B-Control, confirm "Hi-Res" indicator is displayed. Command a +2 µm step change and verify eddy-current sensors confirm the change. This option is particularly valuable for connector and IC lead frame tooling.',
            'Run tonnage verification: with calibrated load cells, measure force at multiple points across the 510 kN range. Verify linearity — force should scale proportionally with press setting.',
            'Optimise for the installed tool area: larger bolsters (1,500 mm) require more attention to force distribution. Use 4-channel monitoring if available. Smaller bolsters (950 mm) allow higher spm due to reduced ram mass.',
            'Check servo feed performance at maximum spm (1,120 spm): feed accuracy, return consistency, and encoder stability. Apply thermal offset correction if feed accuracy degrades after warm-up.',
            'Verify BPG 22 integration (if fitted): switch to tryout mode (1–80 spm at full force). Verify modulated forming profile. Confirm 1:1 data transfer to high-speed production mode.',
            'Run full production trial at target spm. Monitor all parameters for 30 minutes. Save validated configuration to tool library.'
          ]
        }
      },

      // ═══ VARIANT-SPECIFIC PROCEDURES ═══
      {
        id: 'kr_bru_var_001',
        type: 'PROCEDURE',
        scope: 'VARIANT_SPECIFIC',
        title: 'BSTA 200/280/510 with 2 µm option: precision BDC control for micro-tolerance stamping',
        summary: 'Variant-specific procedure for BSTA models fitted with the optional 2 µm ram adjustment resolution, covering calibration, thermal compensation, and micro-tolerance production verification.',
        body: 'The 2 µm ram adjustment option is available on BSTA 200, 280, and 510 models. This doubles the standard ±5 µm precision to ±2 µm for applications requiring the tightest possible BDC control — typically connector stamping, IC lead frames, and micro-component production. The option requires enhanced eddy-current sensor calibration and tighter thermal management.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA-200',
        system: 'Ram and lever mechanism',
        task: '2 µm precision calibration and verification',
        symptom: 'Precision requirement / micro-tolerance production',
        environment: 'Customer site - precision components',
        tags: ['2-micron', 'precision', 'variant-specific', 'BSTA-200', 'BSTA-280', 'BSTA-510', 'micro-tolerance', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Confirm 2 µm option is installed: on B-Control, navigate to "System" → "Configuration". The ram adjustment resolution should show "2 µm" (not standard "10 µm"). The display will show "Hi-Res" indicator on the main dashboard.',
            'Calibrate eddy-current sensors to enhanced precision: the standard calibration is sufficient for ±5 µm, but the 2 µm option requires the extended calibration procedure. Follow B-Control guided calibration with Bruderer precision calibration blocks (part no. BRU-CAL-2UM).',
            'Verify sensor linearity: command step changes of +2 µm, +4 µm, +6 µm, +8 µm, +10 µm. Record actual sensor readings at each step. Linearity error must be <0.5 µm across the range.',
            'Thermal management is critical at 2 µm: the press must reach full thermal equilibrium before production begins. Run at target spm for minimum 45 minutes (versus 30 minutes for standard resolution). Monitor BDC drift — the B-Control should hold ±2 µm throughout.',
            'Enable enhanced thermal compensation: on B-Control, navigate to "Ram" → "Thermal Compensation" → "Hi-Res Mode". This increases the compensation update rate and sensitivity.',
            'Set tighter envelope monitoring: for 2 µm work, set the BDC force window to ±1.5% of reference (versus standard ±3%). Set the BDC position alarm to ±2 µm (versus standard ±5 µm).',
            'Verify with production test: run 1,000 strokes at target spm. Measure 10 random parts for the critical dimension controlled by BDC. Cpk should exceed 1.67 for 2 µm specification.',
            'Environmental considerations: ambient temperature stability is more important at 2 µm. If the factory has temperature swings >5°C during a shift, recommend temperature-controlled enclosure for the press.',
            'Document the validated thermal drift curve, equilibrium time, and Cpk results. Store in the tool library alongside standard parameters. Flag this tool as "2 µm validated" in the library notes.'
          ]
        }
      },
      {
        id: 'kr_bru_var_002',
        type: 'PROCEDURE',
        scope: 'VARIANT_SPECIFIC',
        title: 'BSTA with BPG 22 planetary gearbox: 3-in-1 mode operation and modulated forming',
        summary: 'Variant-specific procedure for BSTA models fitted with the BPG 22 planetary gearbox covering the 3-in-1 mode system: high-speed stamping, low-speed tryout (1–80 spm at full force), and modulated forming (fast approach/slow squeeze/fast return).',
        body: 'The BPG 22 planetary gearbox is available on select BSTA models. It provides a 3-in-1 capability without requiring a separate servo press: (1) high-speed stamping at normal rated spm, (2) low-speed tryout at 1–80 spm with full press force for tool development, and (3) modulated forming with programmable stroke speed profiles — accelerate 200°, constant 30°, brake 130° for slow forming at full tonnage. Test data transfers 1:1 from tryout mode to production mode.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA-510',
        system: 'Drive and gearbox',
        task: 'BPG 22 mode configuration and operation',
        symptom: 'Tool tryout / modulated forming requirement',
        environment: 'Workshop or customer site',
        tags: ['BPG-22', 'planetary-gearbox', '3-in-1', 'modulated-forming', 'tryout', 'variant-specific', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Confirm BPG 22 is installed: on B-Control, navigate to "System" → "Configuration". The drive type should show "BPG 22 Planetary". Three operating mode buttons will be available on the main screen: "High-Speed", "Tryout", and "Modulated".',
            'Mode 1 — High-speed stamping: this is the default production mode. Press operates at normal rated spm with standard drive characteristics. No special configuration needed beyond normal tool setup.',
            'Mode 2 — Low-speed tryout: select "Tryout" on B-Control. Set target speed: 1–80 spm. The press delivers FULL rated force at these low speeds (unlike conventional presses that lose force below ~30% of rated spm). This enables tool development at realistic forming conditions.',
            'In tryout mode: run single strokes or continuous at the selected low speed. All B-Control monitoring (force envelope, BDC position, feed timing) operates normally. Record the complete process data — this data transfers 1:1 to production mode.',
            'Mode 3 — Modulated forming: select "Modulated" on B-Control. Programme the stroke profile: approach phase (typically 200° of rotation at high speed), forming phase (typically 30° at slow speed for controlled material flow), and return phase (typically 130° at high speed).',
            'Configure modulated forming parameters: on B-Control, navigate to "Drive" → "Modulated Profile". Set approach speed (% of rated), forming speed (% of rated — typically 10–30% for slow squeeze applications), and return speed (% of rated).',
            'The key advantage of modulated forming: the slow forming phase applies full tonnage at reduced speed, enabling controlled material flow for complex geometries that would crack or spring back at high speed. No separate servo press required.',
            'Verify 1:1 data transfer: configure a tool in tryout mode. Record all parameters. Switch to high-speed mode. Load the same tool configuration — all parameters should transfer exactly. Run production and compare force curves to tryout baseline.',
            'For modulated forming applications: run 50 test parts at the programmed profile. Measure critical dimensions and compare to parts produced in standard high-speed mode. Document the quality improvement and any parameter adjustments.',
            'Save all three mode configurations (high-speed, tryout, modulated) to the tool library. Include notes on which mode is recommended for initial setup versus production.'
          ]
        }
      },
      {
        id: 'kr_bru_var_003',
        type: 'PROCEDURE',
        scope: 'VARIANT_SPECIFIC',
        title: 'BSTL 350 / BSTA with BSS lubrication: selective oiling integration and nozzle control',
        summary: 'Variant-specific procedure for presses fitted with BSS 5000/7000 strip lubrication system covering B-Control integration, selective oiling zone configuration, oil quantity per stroke calibration, and nozzle pattern programming.',
        body: 'The BSS 5000 and BSS 7000 strip lubrication systems integrate with the Bruderer B-Control for synchronised, selective oiling. The system allows zone-by-zone control of oil quantity and nozzle activation — essential for progressive die stamping where different stations require different lubrication conditions. Oil is applied only where needed, reducing waste and improving part cleanliness.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTL-350',
        system: 'Strip lubrication',
        task: 'BSS lubrication system configuration',
        symptom: 'New tool setup / lubrication optimisation',
        environment: 'Customer site',
        tags: ['BSS-5000', 'BSS-7000', 'selective-oiling', 'strip-lubrication', 'nozzle-control', 'variant-specific', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Identify lubrication system: BSS 5000 (standard capacity) or BSS 7000 (high-capacity for wide strip or high-speed applications). System model is shown on B-Control under "Peripherals" → "Lubrication".',
            'Configure lubrication zones: on B-Control, navigate to "Peripherals" → "Lubrication" → "Zone Configuration". The strip width is divided into zones (typically 10–20 zones depending on system). Enable/disable each zone based on the die layout.',
            'Set oil quantity per stroke: each zone has an independent quantity setting (in µL per stroke). Start with the Bruderer default for the strip material and thickness. Typical range: 0.5–5 µL per stroke per zone.',
            'Programme nozzle pattern: for progressive dies, different stations may need different lubrication. Programme a nozzle activation pattern that matches the die progression — heavy lubrication at drawing stations, light or none at blanking stations.',
            'Synchronise with press timing: on B-Control, set the lubrication trigger angle (the degree of press rotation at which oil is applied). This must occur during the feed portion of the cycle, before the strip enters the die. Typical setting: 30° after TDC.',
            'Calibrate oil flow: run 100 strokes at rated speed. Weigh the oil consumed (collect from test nozzle into graduated container). Compare measured flow to programmed quantity. Adjust calibration factor on B-Control if deviation exceeds ±10%.',
            'Verify selective oiling pattern: run 10 strokes at low speed onto absorbent paper placed on the strip path. The oil pattern should match the programmed zone layout. Adjust zone boundaries if pattern is misaligned.',
            'For BSS 7000 high-capacity system: additional check — verify recirculating oil temperature and filtration. The BSS 7000 has an integrated filter and temperature control. Check filter condition and oil temperature on B-Control lubrication dashboard.',
            'Save lubrication configuration to tool library: all zone settings, quantities, patterns, and timing are stored with the tool setup. When the tool is loaded, the BSS system configures automatically.',
            'Document oil consumption rate for cost tracking. The selective oiling approach typically reduces oil consumption by 30–60% compared to flood lubrication — record baseline for customer ROI analysis.'
          ]
        }
      },
      {
        id: 'kr_bru_var_004',
        type: 'PROCEDURE',
        scope: 'VARIANT_SPECIFIC',
        title: 'BSTA 710+: heavy-tonnage foundation specification and coil handling for high-tonnage models',
        summary: 'Variant-specific procedure for BSTA 710, 810, 1250, 1600, and 2500 covering reinforced foundation requirements (300 mm minimum), high-tonnage coil handling equipment specification, and vibration isolation for heavy presses.',
        body: 'BSTA models 710 and above require reinforced concrete foundations of minimum 300 mm depth (compared to 200 mm for BSTA 200–510). These heavy-tonnage presses (71–250 tonnes) generate significant dynamic forces that must be managed through proper foundation design, vibration isolation, and correctly specified ancillary equipment. This procedure covers the variant-specific requirements for heavy-tonnage installations.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA-710',
        system: 'Installation and foundation',
        task: 'Heavy-tonnage foundation and coil handling setup',
        symptom: 'New installation / relocation / vibration issue',
        environment: 'Customer site',
        tags: ['BSTA-710', 'BSTA-810', 'BSTA-1250', 'BSTA-1600', 'BSTA-2500', 'foundation', 'heavy-tonnage', 'coil-handling', 'variant-specific', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Determine foundation requirement by model: BSTA 710 (71t) — 300 mm reinforced concrete minimum. BSTA 810 (81t) — 300 mm. BSTA 1250 (125t) — 300 mm, consider 400 mm for high-speed operation. BSTA 1600 (160t) — 400 mm. BSTA 2500 (250t) — 400 mm minimum, structural engineer assessment recommended.',
            'Foundation reinforcement specification: steel rebar grid at 200 mm centres, minimum 16 mm diameter bars. For BSTA 1250 and above, double-layer rebar with 12 mm cross-ties. Concrete grade: C40/50 minimum.',
            'Anchor bolt specification: use Bruderer-specified anchor bolts for each model. Bolt length must provide minimum 15x bolt diameter embedment. Torque to specification using calibrated torque wrench. Re-torque after 48 hours and again after first 100 hours of operation.',
            'Vibration isolation: install anti-vibration mounts per Bruderer layout drawing. Mount type and quantity varies by model — specified in the installation manual. Level the press bed to within 0.02 mm/metre after mount installation.',
            'Floor condition survey: before installation, verify floor flatness (max 2 mm deviation over 2 metre straightedge), absence of cracks within 2 metres of press footprint, and adequate drainage for lubrication system.',
            'Coil handling equipment for heavy tonnage: decoiler capacity must exceed maximum coil weight by 30%. For BSTA 710+, typical coil weights are 1,000–5,000 kg. Decoiler foundation bolts must be independently assessed — vibration from the press transmits through the floor.',
            'Straightener specification for wide/thick strip: BSTA 710+ models often process strip 1.5–6 mm thick and 50–300 mm wide. Straightener roller diameter and quantity must match strip specification. Under-specified straighteners cause strip camber and progressive die misalignment.',
            'Vibration transmission assessment: for heavy-tonnage presses near sensitive equipment (CNC machines, CMMs, other presses), measure vibration transmission at 2m, 5m, and 10m from the press at rated speed. If levels exceed neighbour equipment specifications, consider isolation trenches or additional damping.',
            'Crane access: die changes on BSTA 710+ require overhead crane capacity matching the heaviest die plus 20% margin. Verify crane hook height provides sufficient clearance above press crown for die extraction.',
            'Complete installation check: run Bruderer standard acceptance test. Measure tonnage accuracy, BDC repeatability, parallelism, and vibration. Compare to factory test certificate. All values must be within specification before sign-off.'
          ]
        }
      },

      // ═══ GENERIC: Stroke selection and speed modulation ═══
      {
        id: 'kr_bru_gen_008',
        type: 'PROCEDURE',
        scope: 'GENERIC',
        title: 'Stroke selection and speed modulation: adjustable vs fixed stroke workflows',
        summary: 'Process for selecting and configuring stroke length on Bruderer BSTA (adjustable) and BSTL (fixed) presses, including speed range management, quick-change procedures, and speed modulation programming.',
        body: 'Bruderer presses use either adjustable stroke (BSTA series — infinitely variable within model range) or fixed stroke (BSTL series — discrete options requiring mechanical changeover). Speed ranges vary from 100 to 2,300 spm depending on model and stroke setting. This procedure covers the complete workflow for stroke selection and speed management across both platforms.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA Series (all models)',
        system: 'Drive and gearbox',
        task: 'Stroke selection and speed configuration',
        symptom: 'New tool setup / speed change requirement',
        environment: 'Workshop or customer site',
        tags: ['stroke-selection', 'speed-modulation', 'adjustable-stroke', 'fixed-stroke', 'generic', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Determine stroke type: BSTA series = adjustable (set via B-Control, no mechanical change needed). BSTL series = fixed (15.9, 19, 25.4, or 31.8 mm — requires mechanical eccentric changeover).',
            'For BSTA adjustable stroke: on B-Control, navigate to "Press" → "Stroke". Enter the required stroke length within the model range (e.g., 8–32 mm for BSTA 200, 10–64 mm for BSTA 510). The system adjusts the eccentric automatically.',
            'After stroke change on BSTA: the mass counterbalancing system adapts automatically. Verify by running 10 strokes at low speed and checking vibration level on B-Control. Vibration should be within normal range for the new stroke setting.',
            'For BSTL fixed stroke change: isolate press. Follow the quick-change procedure in the BSTL service manual. The eccentric bushing swap typically takes 30–60 minutes for a trained technician. Re-calibrate BDC position on B-Control after mechanical changeover.',
            'Speed range management: maximum spm depends on stroke length — shorter strokes allow higher speeds. B-Control will display the maximum permissible spm for the current stroke setting. Do not attempt to override this limit.',
            'Speed profiles for production: programme ramp-up and ramp-down profiles on B-Control. For high-speed models (>1,500 spm), use staged ramp-up with thermal stabilisation dwells at intermediate speeds.',
            'Speed modulation (BPG 22 models only): programme variable-speed stroke profiles for modulated forming. Define approach speed, forming speed, and return speed as percentages of rated spm.',
            'Verify feed timing compatibility: after any stroke or speed change, verify that the feed window is sufficient for the BSV servo feed to complete its stroke. Adjust feed timing on B-Control if needed.',
            'Record the validated stroke and speed combination in the tool library. Include notes on maximum tested spm and any model-specific limitations observed during validation.'
          ]
        }
      },

      // ═══ GENERIC: Stamping trials process ═══
      {
        id: 'kr_bru_gen_009',
        type: 'PROCEDURE',
        scope: 'GENERIC',
        title: 'Bruderer stamping trials: manufacturer-supported tool testing at production conditions',
        summary: 'Process for conducting stamping trials at Bruderer facilities or customer sites, covering tool testing at full production conditions, data capture for production transfer, and trial report documentation.',
        body: 'Bruderer offers stamping trial services where tools are tested at full production conditions on the target press model. This enables validation of tool design, process parameters, and part quality before committing to production. Trial data transfers directly to the production press via the B-Control tool library. This procedure covers the end-to-end stamping trial process.',
        author: 'Bruderer AG Technical Publications',
        reviewer: 'Technical Reviewer',
        approvalState: 'APPROVED',
        confidence: 'HIGH',
        asset: 'BSTA Series (all models)',
        system: 'Full press system',
        task: 'Stamping trial management',
        symptom: 'New tool validation / production transfer',
        environment: 'Bruderer facility or customer site',
        tags: ['stamping-trials', 'tool-testing', 'production-transfer', 'validation', 'generic', 'bruderer'],
        currentVersion: 1,
        lastValidatedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
        typePayload: {
          steps: [
            'Pre-trial preparation: confirm the trial press model matches the target production press model. Prepare strip material to production specification — minimum 200 metres for meaningful trial. Prepare gauging and measurement equipment for critical dimensions.',
            'Tool installation: install the trial tool on the press. Set shut height, stroke, and feed parameters on B-Control per the tool design specification.',
            'Low-speed validation: start at 50 spm (or minimum spm for BPG 22 equipped presses — as low as 1 spm). Run single strokes. Inspect parts for material flow, blanking quality, and dimensional accuracy. Adjust tool if needed.',
            'Speed ramp-up: increase speed in increments (typically 100 spm steps). At each step, run 50 strokes and inspect parts. Record force curves, BDC position, and feed accuracy at each speed.',
            'Production speed validation: run at target production spm for minimum 30 minutes continuous. Measure 10 parts at intervals (start, 10 min, 20 min, 30 min) for critical dimensions. Monitor for thermal drift effects on part quality.',
            'Capture full process data: B-Control records force curves, BDC position, feed timing, speed stability, and all alarm events during the trial. Export this data set — it is the reference baseline for production.',
            'Transfer parameters to production: save the validated tool configuration to a B-Control backup file (USB). This file contains ALL parameters — force envelopes, speed, feed, BDC, monitoring thresholds. Load directly onto the production press B-Control.',
            'Document trial results: complete the Bruderer trial report template. Include: part measurements, process parameters, force curves, any tool modifications made during trial, and recommended production operating window.',
            'Customer sign-off: review trial results with customer. Confirm part quality meets specification. Agree on production parameters and monitoring thresholds. Customer retains trial report for production reference.'
          ]
        }
      }
    ]
  });

  // ── Relations for Bruderer technical procedures ──
  await prisma.knowledgeRelation.createMany({
    data: [
      { fromRecordId: 'kr_bru_gen_001', toRecordId: 'kr_bru_gen_002', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_gen_002', toRecordId: 'kr_bru_gen_001', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_gen_002', toRecordId: 'kr_bru_gen_007', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_gen_003', toRecordId: 'kr_bru_gen_005', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_gen_004', toRecordId: 'kr_proc_001', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_gen_005', toRecordId: 'kr_bru_gen_003', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_gen_006', toRecordId: 'kr_fail_003', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_gen_007', toRecordId: 'kr_bru_gen_002', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_mod_001', toRecordId: 'kr_bru_var_001', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_mod_002', toRecordId: 'kr_bru_var_004', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_mod_003', toRecordId: 'kr_bru_var_003', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_mod_004', toRecordId: 'kr_bru_var_002', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_var_001', toRecordId: 'kr_bru_gen_002', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_var_002', toRecordId: 'kr_bru_gen_008', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_gen_008', toRecordId: 'kr_bru_var_002', relationType: 'RELATED' },
      { fromRecordId: 'kr_bru_gen_009', toRecordId: 'kr_bru_gen_008', relationType: 'RELATED' }
    ]
  });

  await prisma.knowledgeRelation.createMany({
    data: [
      { fromRecordId: 'kr_proc_001', toRecordId: 'kr_fail_001', relationType: 'RELATED' },
      { fromRecordId: 'kr_fail_001', toRecordId: 'kr_proc_001', relationType: 'RELATED' },
      { fromRecordId: 'kr_proc_001', toRecordId: 'kr_proc_002', relationType: 'RELATED' },
      { fromRecordId: 'kr_proc_002', toRecordId: 'kr_proc_001', relationType: 'RELATED' },
      { fromRecordId: 'kr_int_001', toRecordId: 'kr_fail_001', relationType: 'RELATED' },
      { fromRecordId: 'kr_int_001', toRecordId: 'kr_proc_002', relationType: 'RELATED' },
      { fromRecordId: 'kr_shad_001', toRecordId: 'kr_lesson_001', relationType: 'RELATED' },
      { fromRecordId: 'kr_lesson_001', toRecordId: 'kr_shad_001', relationType: 'RELATED' },
      { fromRecordId: 'kr_note_001', toRecordId: 'kr_fail_002', relationType: 'RELATED' },
      { fromRecordId: 'kr_note_002', toRecordId: 'kr_proc_003', relationType: 'RELATED' },
      { fromRecordId: 'kr_proc_004', toRecordId: 'kr_proc_001', relationType: 'RELATED' },
      { fromRecordId: 'kr_proc_004', toRecordId: 'kr_proc_002', relationType: 'RELATED' },
      { fromRecordId: 'kr_proc_004', toRecordId: 'kr_fail_001', relationType: 'RELATED' },
      { fromRecordId: 'kr_proc_004', toRecordId: 'kr_int_001', relationType: 'RELATED' },
      { fromRecordId: 'kr_proc_005', toRecordId: 'kr_proc_003', relationType: 'RELATED' },
      { fromRecordId: 'kr_proc_005', toRecordId: 'kr_proc_004', relationType: 'RELATED' },
      { fromRecordId: 'kr_fail_003', toRecordId: 'kr_proc_004', relationType: 'RELATED' },
      { fromRecordId: 'kr_fail_004', toRecordId: 'kr_lesson_001', relationType: 'RELATED' },
      { fromRecordId: 'kr_fail_004', toRecordId: 'kr_shad_001', relationType: 'RELATED' },
      { fromRecordId: 'kr_fail_005', toRecordId: 'kr_note_001', relationType: 'RELATED' }
    ]
  });

  await prisma.expertProfile.createMany({
    data: [
      {
        id: 'ep_001',
        name: 'Senior Field Engineer',
        roleFocus: 'Senior Field Service Engineer - BSTA Press Specialist',
        domains: [
          'BSTA press diagnostics',
          'Bearing clearance and ram geometry',
          'Lubrication system service',
          'Press commissioning and relocation',
          'Tonnage verification and calibration',
          'High-speed stamping optimisation'
        ],
        assets: ['BSTA-200', 'BSTA-280', 'BSTA-410', 'BSTA-510', 'BSTA-710', 'BSTA-810', 'BSTA-1250'],
        yearsExperience: 28,
        retirementWindowStart: new Date('2027-01-01'),
        retirementWindowEnd: new Date('2027-09-30'),
        riskLevel: 'HIGH',
        notes: 'Most experienced BSTA field engineer in UK operation. Only engineer with hands-on experience across the full model range including legacy units. Sole holder of knowledge on several legacy customer installations dating back to the 1990s. Critical knowledge transfer priority - no single replacement available. Knowledge must be distributed across multiple engineers.'
      },
      {
        id: 'ep_002',
        name: 'Technical Reviewer',
        roleFocus: 'Technical Review Lead - Factory Liaison',
        domains: [
          'Technical review and validation',
          'Factory specification compliance',
          'Swiss HQ technical liaison',
          'Service documentation standards'
        ],
        assets: ['BSTA-510', 'BSTA-810', 'BSTA-1250', 'BSTA-1600', 'BSTA-2500'],
        yearsExperience: 15,
        riskLevel: 'LOW'
      },
      {
        id: 'ep_003',
        name: 'Service Supervisor',
        roleFocus: 'Service Supervisor - UK Operations',
        domains: [
          'Service scheduling and coordination',
          'Customer relationship management',
          'Turnkey project management',
          'Apprentice development'
        ],
        assets: ['BSTA-280', 'BSTA-410', 'BSTA-510'],
        yearsExperience: 19,
        riskLevel: 'MEDIUM',
        notes: 'Key holder of customer relationship knowledge and site-specific installation history across the UK customer base. Manages the service schedule and knows the quirks of individual customer installations.'
      }
    ]
  });

  await prisma.handoverPack.createMany({
    data: [
      {
        id: 'hp_001',
        expertProfileId: 'ep_001',
        targetRole: 'SENIOR_TECHNICIAN',
        status: 'IN_PROGRESS',
        targetDate: new Date('2027-06-30'),
        coverageScore: 35,
        validatedCount: 3
      },
      {
        id: 'hp_002',
        expertProfileId: 'ep_003',
        targetRole: 'SUPERVISOR',
        status: 'IN_PROGRESS',
        targetDate: new Date('2028-03-31'),
        coverageScore: 15,
        validatedCount: 0
      }
    ]
  });

  await prisma.handoverTask.createMany({
    data: [
      {
        handoverPackId: 'hp_001',
        title: 'Record expert walkthrough: BSTA 810 shaft tile diagnosis and adjustment procedure',
        status: 'DONE',
        assigneeName: 'Service Supervisor',
        dueDate: new Date('2026-04-30'),
        completedAt: new Date('2026-03-05')
      },
      {
        handoverPackId: 'hp_001',
        title: 'Capture bearing clearance adjustment knowledge for all BSTA models with model-specific tolerance notes',
        status: 'DONE',
        assigneeName: 'Service Supervisor',
        dueDate: new Date('2026-05-15'),
        completedAt: new Date('2026-03-01')
      },
      {
        handoverPackId: 'hp_001',
        title: 'Shadow senior engineer on next BSTA 1250 or 1600 service visit - large press service knowledge is most at-risk',
        status: 'IN_PROGRESS',
        assigneeName: 'Field Technician',
        dueDate: new Date('2026-06-30')
      },
      {
        handoverPackId: 'hp_001',
        title: 'Document legacy customer installation history (pre-2010 machines) - senior engineer is sole knowledge holder',
        status: 'OPEN',
        dueDate: new Date('2026-08-31')
      },
      {
        handoverPackId: 'hp_001',
        title: 'Record expert interview: diagnostic sound recognition and press health assessment by ear',
        status: 'DONE',
        assigneeName: 'Service Supervisor',
        dueDate: new Date('2026-05-01'),
        completedAt: new Date('2026-02-25')
      },
      {
        handoverPackId: 'hp_001',
        title: 'Capture relocation procedure refinements and site-specific lessons from 200+ UK relocations',
        status: 'IN_PROGRESS',
        assigneeName: 'Field Technician',
        dueDate: new Date('2026-07-15')
      },
      {
        handoverPackId: 'hp_001',
        title: 'Validate junior engineer competency on BSTA 510 full annual service - independent sign-off',
        status: 'OPEN',
        assigneeName: 'Technical Reviewer',
        dueDate: new Date('2026-09-30')
      },
      {
        handoverPackId: 'hp_002',
        title: 'Document customer-specific service history and relationship notes for top 20 UK accounts',
        status: 'IN_PROGRESS',
        assigneeName: 'Service Supervisor',
        dueDate: new Date('2027-06-30')
      },
      {
        handoverPackId: 'hp_002',
        title: 'Create service scheduling playbook covering seasonal demand patterns and customer SLA requirements',
        status: 'OPEN',
        dueDate: new Date('2027-09-30')
      }
    ]
  });

  // Link knowledge records to expert profiles and handover packs
  await prisma.knowledgeRecord.update({
    where: { id: 'kr_proc_001' },
    data: { sourceExpertId: 'ep_001', handoverPackId: 'hp_001' }
  });
  await prisma.knowledgeRecord.update({
    where: { id: 'kr_fail_001' },
    data: { sourceExpertId: 'ep_001', handoverPackId: 'hp_001' }
  });
  await prisma.knowledgeRecord.update({
    where: { id: 'kr_int_001' },
    data: { sourceExpertId: 'ep_001', handoverPackId: 'hp_001' }
  });
  await prisma.knowledgeRecord.update({
    where: { id: 'kr_proc_002' },
    data: { sourceExpertId: 'ep_001', handoverPackId: 'hp_001' }
  });
  await prisma.knowledgeRecord.update({
    where: { id: 'kr_lesson_001' },
    data: { sourceExpertId: 'ep_001', handoverPackId: 'hp_001' }
  });
  await prisma.knowledgeRecord.update({
    where: { id: 'kr_shad_001' },
    data: { sourceExpertId: 'ep_001', handoverPackId: 'hp_001' }
  });
  await prisma.knowledgeRecord.update({
    where: { id: 'kr_proc_004' },
    data: { sourceExpertId: 'ep_001' }
  });

  await prisma.knowledgeRecordVersion.createMany({
    data: [
      {
        knowledgeRecordId: 'kr_proc_001',
        versionNumber: 1,
        editedBy: 'Senior Field Engineer',
        changeNote: 'Initial version - documented from 15 years of BSTA 510 service experience',
        snapshot: {
          id: 'kr_proc_001',
          type: 'PROCEDURE',
          title: 'Approved method: BSTA 510 annual lubrication system service',
          body: 'This procedure covers the full annual lubrication service for the BSTA 510 lever system, ram bearings, and slide guides.'
        },
        createdAt: new Date('2026-01-10T08:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_note_001',
        versionNumber: 1,
        editedBy: 'Field Technician',
        changeNote: 'Initial version - captured immediately after site visit',
        snapshot: {
          id: 'kr_note_001',
          type: 'FIELD_NOTE',
          title: 'Field note: BSTA 280 servo feed drift at high stroke rates',
          body: 'Called to customer site for intermittent feed misalignment on their BSTA 280.'
        },
        createdAt: new Date('2026-03-01T17:30:00Z')
      },
      {
        knowledgeRecordId: 'kr_fail_001',
        versionNumber: 1,
        editedBy: 'Senior Field Engineer',
        changeNote: 'Initial version - pattern confirmed across three customer sites',
        snapshot: {
          id: 'kr_fail_001',
          type: 'FAILURE_PATTERN',
          title: 'Failure pattern: BSTA 810 shaft tile temperature rise after extended run',
          body: 'Pattern documented across three BSTA 810 installations running automotive connector strip.'
        },
        createdAt: new Date('2025-11-20T09:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_lesson_001',
        versionNumber: 1,
        editedBy: 'Senior Field Engineer',
        changeNote: 'Initial version - documented after commissioning near-miss incident',
        snapshot: {
          id: 'kr_lesson_001',
          type: 'LESSON_LEARNED',
          title: 'Lesson learned: die alignment tolerance differences between BSTA 510 and BSTA 810',
          body: 'During commissioning of a new BSTA 810 at an aerospace customer, die alignment was set using BSTA 510 tolerance specifications.'
        },
        createdAt: new Date('2025-12-05T14:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_int_001',
        versionNumber: 1,
        editedBy: 'Service Supervisor',
        changeNote: 'Initial version - recorded at Telford Competence Centre knowledge capture session',
        snapshot: {
          id: 'kr_int_001',
          type: 'EXPERT_INTERVIEW',
          title: 'Expert interview: BSTA press diagnostics - Senior Field Engineer, 28 years experience',
          body: 'Formal knowledge capture session conducted at Telford Competence Centre.'
        },
        createdAt: new Date('2026-02-25T10:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_shad_001',
        versionNumber: 1,
        editedBy: 'Service Supervisor',
        changeNote: 'Initial version - shadowing session during BSTA 410 commissioning',
        snapshot: {
          id: 'kr_shad_001',
          type: 'SHADOWING_RECORD',
          title: 'Shadowing record: BSTA 410 commissioning and customer handover',
          body: 'Full-day shadowing session during BSTA 410 commissioning at new EV battery connector customer.'
        },
        createdAt: new Date('2026-02-18T17:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_proc_002',
        versionNumber: 1,
        editedBy: 'Senior Field Engineer',
        changeNote: 'Initial version',
        snapshot: {
          id: 'kr_proc_002',
          type: 'PROCEDURE',
          title: 'Approved method: BSTA press bearing clearance inspection and adjustment',
          body: 'Bearing clearance inspection is the single most important measurement during any BSTA service visit.'
        },
        createdAt: new Date('2025-10-15T08:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_proc_002',
        versionNumber: 2,
        editedBy: 'Senior Field Engineer',
        changeNote: 'Updated torque values for BSTA 810 following factory bulletin BRU-SB-2026-003',
        snapshot: {
          id: 'kr_proc_002',
          type: 'PROCEDURE',
          title: 'Approved method: BSTA press bearing clearance inspection and adjustment',
          body: 'Bearing clearance inspection is the single most important measurement during any BSTA service visit.'
        },
        createdAt: new Date('2026-03-01T11:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_note_002',
        versionNumber: 1,
        editedBy: 'Field Technician',
        changeNote: 'Initial version - captured after site visit',
        snapshot: {
          id: 'kr_note_002',
          type: 'FIELD_NOTE',
          title: 'Field note: coil handling unit vibration on BSTA 1250 high-tonnage line',
          body: 'Called to a medical device stamper running a BSTA 1250 with integrated OEM decoiler.'
        },
        createdAt: new Date('2026-03-08T16:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_fail_002',
        versionNumber: 1,
        editedBy: 'Senior Field Engineer',
        changeNote: 'Initial version - pattern confirmed across four customer sites in electronics sector',
        snapshot: {
          id: 'kr_fail_002',
          type: 'FAILURE_PATTERN',
          title: 'Failure pattern: press monitoring false alarms on BSTA 200 running thin copper strip',
          body: 'Multiple BSTA 200 customers in the electronics connector sector reporting frequent tonnage monitor false alarms.'
        },
        createdAt: new Date('2025-12-12T10:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_proc_003',
        versionNumber: 1,
        editedBy: 'Senior Field Engineer',
        changeNote: 'Initial version - distilled from 200+ UK press relocations',
        snapshot: {
          id: 'kr_proc_003',
          type: 'PROCEDURE',
          title: 'Approved method: BSTA press machine relocation - site preparation and re-levelling',
          body: 'Machine relocations are a key service offering.'
        },
        createdAt: new Date('2026-03-06T09:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_proc_004',
        versionNumber: 1,
        editedBy: 'Senior Field Engineer',
        changeNote: 'Initial version - compiled from official OEM publications (Fraunhofer IWU 2024, STAMPER magazines)',
        snapshot: {
          id: 'kr_proc_004',
          type: 'PROCEDURE',
          title: 'OEM BSTA fault-finding walkthrough (B-Control, sensors, mechanical tolerances)',
          body: 'Standard diagnostic sequence for BSTA high-speed stamping presses.'
        },
        createdAt: new Date('2026-03-10T09:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_proc_005',
        versionNumber: 1,
        editedBy: 'Service Supervisor',
        changeNote: 'Initial version - standard pre-visit checklist formalised from team best practice',
        snapshot: {
          id: 'kr_proc_005',
          type: 'PROCEDURE',
          title: 'Approved method: pre-visit site checklist for BSTA service calls',
          body: 'This checklist ensures every field service visit starts with the right information, tools, and parts.'
        },
        createdAt: new Date('2026-03-12T08:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_fail_003',
        versionNumber: 1,
        editedBy: 'Senior Field Engineer',
        changeNote: 'Initial version - pattern confirmed at two customer sites over summer 2025',
        snapshot: {
          id: 'kr_fail_003',
          type: 'FAILURE_PATTERN',
          title: 'Failure pattern: clutch slip on BSTA 410 at high stroke rates during summer months',
          body: 'Intermittent clutch slip causing missed strokes on BSTA 410 presses.'
        },
        createdAt: new Date('2026-01-20T10:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_fail_004',
        versionNumber: 1,
        editedBy: 'Senior Field Engineer',
        changeNote: 'Initial version - pattern confirmed across three customer sites with operator-performed changeovers',
        snapshot: {
          id: 'kr_fail_004',
          type: 'FAILURE_PATTERN',
          title: 'Failure pattern: progressive die misalignment on BSTA 510 after tooling change',
          body: 'Recurring die misalignment issue after tool changeover on BSTA 510 presses.'
        },
        createdAt: new Date('2026-02-01T09:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_fail_005',
        versionNumber: 1,
        editedBy: 'Field Technician',
        changeNote: 'Initial version - three encoder failures documented in 6 months at two sites',
        snapshot: {
          id: 'kr_fail_005',
          type: 'FAILURE_PATTERN',
          title: 'Failure pattern: servo feed encoder failure after coolant contamination',
          body: 'Three encoder failures in 6 months across two customer sites.'
        },
        createdAt: new Date('2026-02-10T15:00:00Z')
      }
    ]
  });

  await prisma.auditEvent.createMany({
    data: [
      // kr_proc_001 - lubrication procedure: created -> approved
      {
        knowledgeRecordId: 'kr_proc_001',
        actorUserId: senior.id,
        actorName: senior.displayName,
        actorRole: senior.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2026-01-10T08:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_proc_001',
        actorUserId: supervisor.id,
        actorName: supervisor.displayName,
        actorRole: supervisor.role,
        eventType: 'STATUS_CHANGED',
        fromStatus: 'DRAFT',
        toStatus: 'UNDER_REVIEW',
        createdAt: new Date('2026-01-12T09:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_proc_001',
        actorUserId: reviewer.id,
        actorName: reviewer.displayName,
        actorRole: reviewer.role,
        eventType: 'REVIEW_DECISION',
        fromStatus: 'UNDER_REVIEW',
        toStatus: 'APPROVED',
        metadata: { reviewDecision: 'APPROVE', reviewerRationale: 'Comprehensive procedure validated against factory specifications. Approved for use across all UK BSTA 510 service visits.' },
        createdAt: new Date('2026-02-20T14:00:00Z')
      },

      // kr_note_001 - servo feed drift: created -> under review
      {
        knowledgeRecordId: 'kr_note_001',
        actorUserId: technician.id,
        actorName: technician.displayName,
        actorRole: technician.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2026-03-01T17:30:00Z')
      },
      {
        knowledgeRecordId: 'kr_note_001',
        actorUserId: supervisor.id,
        actorName: supervisor.displayName,
        actorRole: supervisor.role,
        eventType: 'STATUS_CHANGED',
        fromStatus: 'DRAFT',
        toStatus: 'UNDER_REVIEW',
        createdAt: new Date('2026-03-02T09:15:00Z')
      },

      // kr_fail_001 - shaft tile pattern: created -> approved
      {
        knowledgeRecordId: 'kr_fail_001',
        actorUserId: senior.id,
        actorName: senior.displayName,
        actorRole: senior.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2025-11-20T09:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_fail_001',
        actorUserId: reviewer.id,
        actorName: reviewer.displayName,
        actorRole: reviewer.role,
        eventType: 'REVIEW_DECISION',
        fromStatus: 'UNDER_REVIEW',
        toStatus: 'APPROVED',
        metadata: { reviewDecision: 'APPROVE', reviewerRationale: 'Critical pattern validated with factory engineering team in Frasnacht. Solution confirmed effective.' },
        createdAt: new Date('2026-02-15T11:00:00Z')
      },

      // kr_lesson_001 - die alignment lesson: created -> approved
      {
        knowledgeRecordId: 'kr_lesson_001',
        actorUserId: senior.id,
        actorName: senior.displayName,
        actorRole: senior.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2025-12-05T14:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_lesson_001',
        actorUserId: reviewer.id,
        actorName: reviewer.displayName,
        actorRole: reviewer.role,
        eventType: 'REVIEW_DECISION',
        fromStatus: 'UNDER_REVIEW',
        toStatus: 'APPROVED',
        metadata: { reviewDecision: 'APPROVE', reviewerRationale: 'Important safety lesson. Added to mandatory pre-commissioning checklist.' },
        createdAt: new Date('2026-01-30T10:00:00Z')
      },

      // kr_int_001 - expert interview: created -> under review
      {
        knowledgeRecordId: 'kr_int_001',
        actorUserId: supervisor.id,
        actorName: supervisor.displayName,
        actorRole: supervisor.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2026-02-25T10:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_int_001',
        actorUserId: supervisor.id,
        actorName: supervisor.displayName,
        actorRole: supervisor.role,
        eventType: 'STATUS_CHANGED',
        fromStatus: 'DRAFT',
        toStatus: 'UNDER_REVIEW',
        createdAt: new Date('2026-02-26T08:30:00Z')
      },

      // kr_shad_001 - shadowing: created -> approved
      {
        knowledgeRecordId: 'kr_shad_001',
        actorUserId: supervisor.id,
        actorName: supervisor.displayName,
        actorRole: supervisor.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2026-02-18T17:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_shad_001',
        actorUserId: reviewer.id,
        actorName: reviewer.displayName,
        actorRole: reviewer.role,
        eventType: 'REVIEW_DECISION',
        fromStatus: 'UNDER_REVIEW',
        toStatus: 'APPROVED',
        metadata: { reviewDecision: 'APPROVE', reviewerRationale: 'Good progress documented. Competency assessment aligns with observation.' },
        createdAt: new Date('2026-03-05T10:00:00Z')
      },

      // kr_proc_002 - bearing clearance: created -> approved (v2 update)
      {
        knowledgeRecordId: 'kr_proc_002',
        actorUserId: senior.id,
        actorName: senior.displayName,
        actorRole: senior.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2025-10-15T08:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_proc_002',
        actorUserId: reviewer.id,
        actorName: reviewer.displayName,
        actorRole: reviewer.role,
        eventType: 'REVIEW_DECISION',
        fromStatus: 'UNDER_REVIEW',
        toStatus: 'APPROVED',
        metadata: { reviewDecision: 'APPROVE', reviewerRationale: 'Core procedure validated against OEM factory service manual. Critical for all field engineers.' },
        createdAt: new Date('2026-03-01T11:00:00Z')
      },

      // kr_note_002 - coil handling vibration: created (draft)
      {
        knowledgeRecordId: 'kr_note_002',
        actorUserId: technician.id,
        actorName: technician.displayName,
        actorRole: technician.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2026-03-08T16:00:00Z')
      },

      // kr_fail_002 - false alarms: created -> approved
      {
        knowledgeRecordId: 'kr_fail_002',
        actorUserId: senior.id,
        actorName: senior.displayName,
        actorRole: senior.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2025-12-12T10:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_fail_002',
        actorUserId: reviewer.id,
        actorName: reviewer.displayName,
        actorRole: reviewer.role,
        eventType: 'REVIEW_DECISION',
        fromStatus: 'UNDER_REVIEW',
        toStatus: 'APPROVED',
        metadata: { reviewDecision: 'APPROVE', reviewerRationale: 'Solution verified with OEM AG monitoring systems team. Parameter changes confirmed safe for all BSTA 200 units.' },
        createdAt: new Date('2026-02-28T15:00:00Z')
      },

      // kr_proc_003 - relocation: created -> under review
      {
        knowledgeRecordId: 'kr_proc_003',
        actorUserId: senior.id,
        actorName: senior.displayName,
        actorRole: senior.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2026-03-06T09:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_proc_003',
        actorUserId: supervisor.id,
        actorName: supervisor.displayName,
        actorRole: supervisor.role,
        eventType: 'STATUS_CHANGED',
        fromStatus: 'DRAFT',
        toStatus: 'UNDER_REVIEW',
        createdAt: new Date('2026-03-07T08:00:00Z')
      },

      // kr_proc_004 - fault-finding walkthrough: created -> approved
      {
        knowledgeRecordId: 'kr_proc_004',
        actorUserId: senior.id,
        actorName: senior.displayName,
        actorRole: senior.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2026-03-10T09:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_proc_004',
        actorUserId: reviewer.id,
        actorName: reviewer.displayName,
        actorRole: reviewer.role,
        eventType: 'REVIEW_DECISION',
        fromStatus: 'UNDER_REVIEW',
        toStatus: 'APPROVED',
        metadata: { reviewDecision: 'APPROVE', reviewerRationale: 'Verified against official OEM publications. Tolerances cross-checked with Frasnacht engineering. Approved as standard diagnostic reference.' },
        createdAt: new Date('2026-03-10T14:00:00Z')
      },

      // kr_proc_005 - pre-visit checklist: created -> approved
      {
        knowledgeRecordId: 'kr_proc_005',
        actorUserId: supervisor.id,
        actorName: supervisor.displayName,
        actorRole: supervisor.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2026-03-12T08:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_proc_005',
        actorUserId: reviewer.id,
        actorName: reviewer.displayName,
        actorRole: reviewer.role,
        eventType: 'REVIEW_DECISION',
        fromStatus: 'UNDER_REVIEW',
        toStatus: 'APPROVED',
        metadata: { reviewDecision: 'APPROVE', reviewerRationale: 'Standard pre-visit checklist approved. Mandatory for all service visits.' },
        createdAt: new Date('2026-03-12T11:00:00Z')
      },

      // kr_fail_003 - clutch slip: created -> approved
      {
        knowledgeRecordId: 'kr_fail_003',
        actorUserId: senior.id,
        actorName: senior.displayName,
        actorRole: senior.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2026-01-20T10:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_fail_003',
        actorUserId: reviewer.id,
        actorName: reviewer.displayName,
        actorRole: reviewer.role,
        eventType: 'REVIEW_DECISION',
        fromStatus: 'UNDER_REVIEW',
        toStatus: 'APPROVED',
        metadata: { reviewDecision: 'APPROVE', reviewerRationale: 'Seasonal pattern confirmed. Air pressure adjustment within safe operating range.' },
        createdAt: new Date('2026-03-11T09:00:00Z')
      },

      // kr_fail_004 - die misalignment: created -> approved
      {
        knowledgeRecordId: 'kr_fail_004',
        actorUserId: senior.id,
        actorName: senior.displayName,
        actorRole: senior.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2026-02-01T09:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_fail_004',
        actorUserId: reviewer.id,
        actorName: reviewer.displayName,
        actorRole: reviewer.role,
        eventType: 'REVIEW_DECISION',
        fromStatus: 'UNDER_REVIEW',
        toStatus: 'APPROVED',
        metadata: { reviewDecision: 'APPROVE', reviewerRationale: 'Root cause validated. Operator retraining procedure added to service offering.' },
        createdAt: new Date('2026-03-08T14:00:00Z')
      },

      // kr_fail_005 - encoder contamination: created -> approved
      {
        knowledgeRecordId: 'kr_fail_005',
        actorUserId: technician.id,
        actorName: technician.displayName,
        actorRole: technician.role,
        eventType: 'RECORD_CREATED',
        toStatus: 'DRAFT',
        createdAt: new Date('2026-02-10T15:00:00Z')
      },
      {
        knowledgeRecordId: 'kr_fail_005',
        actorUserId: reviewer.id,
        actorName: reviewer.displayName,
        actorRole: reviewer.role,
        eventType: 'REVIEW_DECISION',
        fromStatus: 'UNDER_REVIEW',
        toStatus: 'APPROVED',
        metadata: { reviewDecision: 'APPROVE', reviewerRationale: 'IP67 retrofit kit confirmed available from OEM AG parts catalogue. Added to environmental risk checklist.' },
        createdAt: new Date('2026-03-09T10:00:00Z')
      }
    ]
  });

  console.log('Seeded OEM UK field service knowledge base:');
  console.log('  - 5 users (role-based)');
  console.log('  - 15 knowledge records');
  console.log('  - 20 knowledge relations');
  console.log('  - 3 expert profiles');
  console.log('  - 2 handover packs with 9 tasks');
  console.log('  - 16 record versions');
  console.log('  - 31 audit events');
  console.log('');
  console.log('Login: technician/technician123, senior/senior123, supervisor/supervisor123, reviewer/reviewer123, admin/admin123');
  void admin;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
