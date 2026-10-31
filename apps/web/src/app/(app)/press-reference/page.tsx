import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { requireAnyRole } from '@/lib/authz';

const BSTA_MODELS = [
  { model: 'BSTL 350', force: '350 kN (35t)', maxSpm: '1,200', optSpm: '\u2014', toolArea: '880 mm', stroke: '15.9/19/25.4/31.8 mm (fixed)', ram: '\u00b15 \u00b5m', feed: 'Servo', drive: 'IE5', notes: 'OPC-UA + cyber security standard' },
  { model: 'BSTA 200', force: '200 kN (20t)', maxSpm: '2,000', optSpm: '2,300', toolArea: '600\u2013700 mm', stroke: '8\u201332 mm', ram: '\u00b15 \u00b5m (2 \u00b5m opt)', feed: 'Servo', drive: 'IE5', notes: 'Highest speed in range' },
  { model: 'BSTA 280', force: '280 kN (28t)', maxSpm: '1,500', optSpm: '2,000', toolArea: '750\u2013880 mm', stroke: '10\u201338 mm', ram: '\u00b15 \u00b5m (2 \u00b5m opt)', feed: 'Servo', drive: 'IE5', notes: '2 \u00b5m option available' },
  { model: 'BSTA 410', force: '410 kN (41t)', maxSpm: '1,600', optSpm: '\u2014', toolArea: '1,100 mm', stroke: '10\u201351 mm', ram: '\u00b15 \u00b5m', feed: 'Servo', drive: 'IE5', notes: '' },
  { model: 'BSTA 510', force: '510 kN (51t)', maxSpm: '1,120', optSpm: '\u2014', toolArea: '950\u20131,500 mm', stroke: '10\u201364 mm', ram: '\u00b15 \u00b5m (2 \u00b5m opt)', feed: 'Servo', drive: 'IE5', notes: 'BPG 22 option; most common UK model' },
  { model: 'BSTA 710', force: '710 kN (71t)', maxSpm: '850', optSpm: '\u2014', toolArea: '2,200 mm', stroke: '10\u201376 mm', ram: '\u00b15 \u00b5m', feed: 'Servo', drive: 'IE5', notes: '300mm foundation minimum' },
  { model: 'BSTA 810', force: '810 kN (81t)', maxSpm: '1,000', optSpm: '\u2014', toolArea: '970\u20131,800 mm', stroke: '10\u201376 mm', ram: '\u00b15 \u00b5m', feed: 'Servo', drive: 'IE5', notes: '300mm foundation minimum' },
  { model: 'BSTA 1250', force: '1,250 kN (125t)', maxSpm: '850', optSpm: '\u2014', toolArea: '1,170\u20131,810 mm', stroke: '16\u2013100 mm', ram: '\u00b15 \u00b5m', feed: 'Servo', drive: 'IE5', notes: '89 mm ram adj. range; 25\u201330t weight' },
  { model: 'BSTA 1600', force: '1,600 kN (160t)', maxSpm: '825', optSpm: '\u2014', toolArea: '1,170\u20132,200 mm', stroke: '13\u2013100 mm', ram: '\u00b15 \u00b5m', feed: 'Servo', drive: 'IE5', notes: '400mm foundation recommended' },
  { model: 'BSTA 2500', force: '2,500 kN (250t)', maxSpm: '710', optSpm: '\u2014', toolArea: '2,700 mm', stroke: '16\u2013127 mm', ram: '\u00b15 \u00b5m', feed: 'Servo', drive: 'IE5', notes: 'Structural engineer assessment req.' },
];

const KEY_SYSTEMS = [
  { system: 'Bruderer Lever System', description: 'Patented lever mechanism: power from short torsional-rigid transverse main shaft via two connecting rods, lever mechanism, and push rods. Each spindle carries only ~20% of total ram load \u2014 minimises deflection under eccentric loads. Bearing clearance target: 0.003\u20130.008 mm per side.' },
  { system: 'Mass Counterbalancing', description: 'Automatic adaptation to stroke changes. Enables vibration-free high-speed operation. No manual adjustment required \u2014 system self-balances when stroke length is changed via B-Control.' },
  { system: 'Recirculating Pressure Lubrication', description: 'Central forced-feed system with integrated heat exchanger. ISO VG 68 grade oil. Annual flush recommended. Low oil pressure is the #1 root cause of mechanical faults. Temperature range: 35\u201355\u00b0C.' },
  { system: 'B-Control / B3 IPC', description: 'Touch-screen IPC control: error archive, live press-force and position monitoring, envelope curve analysis, tool library (1,000 setups). OPC-UA server + EtherCAT bus for peripherals and MES/SCADA integration.' },
  { system: 'BSV Servo Feed', description: 'Servo-driven feed with encoder feedback for precision at high speeds. Programmable feed profiles. Watch for thermal drift on encoder mounts above 1,200 spm. BBV mechanical feed also available.' },
  { system: 'Press Monitoring', description: 'Press-force sensors (2x standard, 4x optional). Eddy-current sensors in die measure actual BDC depth for closed-loop ram position control. 4-input position monitoring detects ram tilt and guide wear.' },
  { system: 'Clutch & Brake', description: 'Pneumatic clutch/brake system optimised for first/last strike quality. Operating pressure 5\u20136 bar. Slip at high spm indicates worn friction surfaces. B-Control monitors engagement time and overrun angle.' },
  { system: 'Coil Handling', description: 'Decoilers, straighteners, and rewind equipment. Connected via EtherCAT. Foundation spec critical for high-tonnage models (300 mm reinforced concrete for BSTA 710+, 400 mm for BSTA 1600+).' },
];

const BPG_22_MODES = [
  { mode: 'High-Speed Stamping', description: 'Standard production mode at rated spm. Normal drive characteristics.', speed: 'Full rated spm', force: '100% rated' },
  { mode: 'Low-Speed Tryout', description: 'Tool development at realistic forming conditions. Full force at very low speed \u2014 unlike conventional presses that lose force below ~30% rated spm.', speed: '1\u201380 spm', force: '100% rated' },
  { mode: 'Modulated Forming', description: 'Programmable stroke speed profile: fast approach (200\u00b0), slow squeeze (30\u00b0 at full tonnage), fast return (130\u00b0). Eliminates need for separate servo press. Test data transfers 1:1 to production.', speed: 'Variable per phase', force: '100% rated' },
];

const MONITORING_SYSTEMS = [
  { system: 'B-Control IPC', detail: 'IPC-based touch-screen control. Multilingual display with error archive, live press-force/position. Manual, semi-automatic, or automatic ram axis corrections during operation. OPC-UA server and EtherCAT bus standard on BSTL; available on BSTA.' },
  { system: 'Press-force sensors', detail: '2x or 4x load channels for tonnage measurement. Dynamic envelope curve monitoring across full 360\u00b0 stroke cycle \u2014 not just peak load at BDC. Configurable warning and stop thresholds.' },
  { system: 'Eddy-current sensors', detail: 'Located in the die. Measure actual insertion depth at BDC for real-time closed-loop ram position control. Enable \u00b15 \u00b5m dynamic correction during stamping (2 \u00b5m with Hi-Res option).' },
  { system: 'Tool monitoring', detail: 'Up to 12 separate analogue tool channels (PSA sensors) for individual station forces. Up to 24 digital inputs/CAM outputs. Tool library stores 1,000 setups with parameters, force envelopes, and operator notes.' },
  { system: 'ShopFloorConnect (OEE)', detail: 'Real-time OEE and downtime tracking. SMI 2 machine-mounted interfaces collect data with no operator involvement. Large-format factory displays. Microsoft SQL integration for quality analysis.' },
  { system: 'BSS Strip Lubrication', detail: 'BSS 5000/7000 selective oiling systems. Zone-by-zone nozzle control integrated with B-Control. Synchronised with press timing. Oil quantity programmable per stroke per zone. Reduces waste by 30\u201360% vs flood lubrication.' },
];

const INDUSTRY_APPLICATIONS = [
  { sector: 'Automotive', components: 'Plug-in connectors (~8,000 per vehicle), ECU housings, terminal strips, battery contacts', growth: 'EV electrification driving massive demand for stamped connectors and motor laminations' },
  { sector: 'Electronics', components: 'IC lead frames, SIM card contacts, USB/Lightning connectors, semiconductor packages', growth: 'Miniaturisation requires tighter tolerances at higher speeds' },
  { sector: 'Medical', components: 'Surgical instrument parts, implant components, diagnostic device housings', growth: 'Growing sector \u2014 high precision, regulatory traceability' },
  { sector: 'Aerospace', components: 'Electrical connectors, sensor housings, structural clips and fasteners', growth: 'Electric aviation creating new demand for lightweight stamped components' },
  { sector: 'EV / Renewables', components: 'Battery tab connectors, motor rotor/stator laminations, charging connector pins', growth: 'Highest growth sector \u2014 rotor/stator laminations require absolute repeat accuracy' },
  { sector: 'Construction', components: 'Metal fixings, brackets, cable management components', growth: 'Post-fire legislation driving switch from plastic to metal fixings' },
];

const CRITICAL_TOLERANCES = [
  { item: 'Dynamic ram adjustment', value: '\u00b15 \u00b5m during stamping', source: 'Bruderer AG / Fraunhofer IWU 2024' },
  { item: 'Hi-Res ram adjustment (option)', value: '2 \u00b5m (BSTA 200/280/510)', source: 'STAMPER 1/17' },
  { item: 'Standard resolution', value: '10 \u00b5m', source: 'Fraunhofer IWU 2024' },
  { item: 'Bearing clearance target', value: '0.003\u20130.008 mm per side', source: 'Bruderer service manual Ch.4' },
  { item: 'Max allowable clearance', value: '0.015 mm per side', source: 'Bruderer service manual Ch.4' },
  { item: 'Guide clearance', value: 'Backlash-free at strip level', source: 'Bruderer AG specs' },
  { item: 'Ram load per spindle', value: '~20% of total (lever system)', source: 'Bruderer AG patent / specs' },
  { item: 'Relocation levelling', value: '0.02 mm/metre', source: 'Installation spec' },
  { item: 'Tonnage deviation after relocation', value: 'Max 2% of nominal force', source: 'Service procedure' },
  { item: 'Foundation (BSTA 200\u2013510)', value: '200 mm reinforced concrete min', source: 'Installation spec' },
  { item: 'Foundation (BSTA 710+)', value: '300\u2013400 mm reinforced concrete', source: 'Installation spec' },
];

export default async function PressReferencePage() {
  await requireAnyRole(['TECHNICIAN', 'SENIOR_TECHNICIAN', 'SUPERVISOR', 'REVIEWER', 'ADMIN']);

  return (
    <div className="space-y-6">
      <PageHeader title="Bruderer High-Speed Press Reference" description="Model specifications, patented systems, and critical tolerances from official Bruderer AG publications." />

      {/* Model specs table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">BSTA and BSTL model specifications</CardTitle>
          <p className="text-sm text-muted-foreground">All models feature the patented Bruderer lever system, IE5 drive, and servo feed as standard. Data from bruderer.com and Fraunhofer IWU 2024.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Force</TableHead>
                  <TableHead>Max spm</TableHead>
                  <TableHead>Opt spm</TableHead>
                  <TableHead>Tool area</TableHead>
                  <TableHead>Stroke</TableHead>
                  <TableHead>Ram adj.</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {BSTA_MODELS.map((m) => (
                  <TableRow key={m.model}>
                    <TableCell className="font-semibold text-primary">{m.model}</TableCell>
                    <TableCell>{m.force}</TableCell>
                    <TableCell>{m.maxSpm}</TableCell>
                    <TableCell className="text-muted-foreground">{m.optSpm}</TableCell>
                    <TableCell>{m.toolArea}</TableCell>
                    <TableCell>{m.stroke}</TableCell>
                    <TableCell>{m.ram}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Key systems */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Key systems overview</CardTitle>
          <p className="text-sm text-muted-foreground">Core Bruderer technologies based on patented designs and official specifications.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {KEY_SYSTEMS.map((s) => (
              <div key={s.system} className="rounded-md border p-3">
                <h4 className="font-semibold text-primary">{s.system}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* BPG 22 Planetary Gearbox */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">BPG 22 Planetary Gearbox (3-in-1 system)</CardTitle>
          <p className="text-sm text-muted-foreground">Available on select BSTA models. Replaces the need for a separate servo press for tool development and modulated forming applications.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mode</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>Force</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BPG_22_MODES.map((m) => (
                <TableRow key={m.mode}>
                  <TableCell className="font-semibold text-primary">{m.mode}</TableCell>
                  <TableCell className="text-sm">{m.description}</TableCell>
                  <TableCell>{m.speed}</TableCell>
                  <TableCell>{m.force}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monitoring and control */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Monitoring and control systems</CardTitle>
          <p className="text-sm text-muted-foreground">Systems a field service engineer interacts with on every visit. Data from bruderer.com product pages.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {MONITORING_SYSTEMS.map((m) => (
            <div key={m.system} className="rounded-md border p-3">
              <h4 className="font-semibold text-primary">{m.system}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{m.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Industry applications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Industry applications</CardTitle>
          <p className="text-sm text-muted-foreground">Key sectors served by Bruderer customers. Useful context for understanding what each customer site produces.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sector</TableHead>
                <TableHead>Typical components</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INDUSTRY_APPLICATIONS.map((a) => (
                <TableRow key={a.sector}>
                  <TableCell className="font-semibold text-primary">{a.sector}</TableCell>
                  <TableCell>{a.components}</TableCell>
                  <TableCell className="text-muted-foreground">{a.growth}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Critical tolerances */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Critical tolerances and specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CRITICAL_TOLERANCES.map((t) => (
                <TableRow key={t.item}>
                  <TableCell>{t.item}</TableCell>
                  <TableCell className="font-semibold text-primary">{t.value}</TableCell>
                  <TableCell className="text-muted-foreground">{t.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button render={<Link href="/procedures" />}>
          Browse procedures
        </Button>
        <Button variant="outline" render={<Link href="/search?status=APPROVED&keyword=BSTA" />}>
          Search approved BSTA methods
        </Button>
        <Button variant="outline" render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
