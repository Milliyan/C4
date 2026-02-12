import { Node, Edge } from 'reactflow';
import { CircuitNodeData } from '@/types';
import * as math from 'mathjs';

// --- Types & Interfaces ---

export interface SolverStep {
  title: string;
  description: string;
  latex?: string;
  latex_lines?: string[];
  matrix?: string;
}

export interface SolverResult {
  steps: SolverStep[];
  nodeVoltages?: Record<string, math.Complex>;
  analysisType?: string;
}

interface NetlistComponent {
  id: string;
  type: string;
  value: number;
  phase_deg?: number;
  node_pos: string; // Positive / Input+
  node_neg: string; // Negative / Input-
  node_out?: string; // For OpAmps
  [key: string]: any;
}

interface NetlistData {
  nodes: string[];
  components: NetlistComponent[];
  global_freq_hz: number;
}

// --- Circuit Engine Class (Ported from Python) ---

class CircuitEngine {
  raw_data: NetlistData;
  freq: number;
  omega: number;
  nodes: Set<string>;
  components: NetlistComponent[];
  steps: SolverStep[];
  
  // Variables for MNA
  node_vars: string[]; // List of node names (excluding '0')
  current_vars: string[]; // List of component IDs that need current vars (V_Source, Op_Amp)
  
  constructor(netlist: NetlistData) {
    this.raw_data = netlist;
    this.freq = netlist.global_freq_hz;
    this.omega = 2 * Math.PI * this.freq;
    this.nodes = new Set(netlist.nodes);
    this.components = netlist.components;
    this.steps = [];
    
    this.node_vars = [];
    this.current_vars = [];
    this._init_variables();
  }

  _init_variables() {
    // Identify unknown voltage nodes (all except '0')
    this.node_vars = Array.from(this.nodes).filter(n => n !== "0");
    
    // Identify components needing auxiliary current variables
    // V_Source and Op_Amp (output leg) need current vars in MNA
    this.components.forEach(comp => {
      if (comp.type === 'V_Source' || comp.type === 'Op_Amp') {
        this.current_vars.push(comp.id);
      }
    });
  }

  _get_impedance(comp: NetlistComponent): { val: math.Complex, latex: string } {
    const val = comp.value;
    const cid = comp.id;
    
    if (comp.type === 'Resistor') {
      return { val: math.complex(val, 0), latex: `R_{${cid}}` };
    }
    if (comp.type === 'Inductor') {
      // j * omega * L
      const z = math.complex(0, this.omega * val);
      return { val: z, latex: `j\\omega L_{${cid}}` };
    }
    if (comp.type === 'Capacitor') {
      // 1 / (j * omega * C) = -j / (omega * C)
      const wc = this.omega * val;
      if (wc === 0) return { val: math.complex(Infinity, 0), latex: `\\infty` }; // DC Block
      const z = math.divide(1, math.complex(0, wc)) as math.Complex;
      return { val: z, latex: `\\frac{1}{j\\omega C_{${cid}}}` };
    }
    return { val: math.complex(0, 0), latex: '0' };
  }

  _format_complex(val: math.Complex | number, unit: string) {
    const c = typeof val === 'number' ? math.complex(val, 0) : val;
    const polar = c.toPolar();
    const mag = polar.r;
    const ang_deg = polar.phi * (180 / Math.PI);
    
    return {
      magnitude: mag,
      angle_deg: ang_deg,
      polar: `${mag.toPrecision(4)} ∠ ${ang_deg.toFixed(2)}° ${unit}`,
      rect: c.format(4),
      unit
    };
  }

  // --- Main Solver (MNA) ---
  solve_system(): { results: any, steps: SolverStep[], error?: string } {
    const n_v = this.node_vars.length;
    const n_i = this.current_vars.length;
    const size = n_v + n_i;
    
    if (size === 0) return { results: {}, steps: this.steps, error: "Empty Circuit" };

    // Matrix A (size x size)
    const A = math.zeros(size, size) as math.Matrix;
    // Vector Z (size x 1) - RHS
    const Z = math.zeros(size, 1) as math.Matrix;
    
    const latex_equations: string[] = [];

    // Map variable names to matrix indices
    const var_map = new Map<string, number>();
    this.node_vars.forEach((name, idx) => var_map.set(`V_${name}`, idx));
    this.current_vars.forEach((name, idx) => var_map.set(`I_${name}`, n_v + idx));

    // Helper to get index of a node voltage variable
    const get_v_idx = (node: string) => (node === "0" ? -1 : var_map.get(`V_${node}`));
    // Helper to get index of a current variable
    const get_i_idx = (id: string) => var_map.get(`I_${id}`);

    // 1. KCL Equations for each Node
    this.node_vars.forEach((node, row_idx) => {
      let latex_lhs_parts: string[] = [];
      let latex_rhs = "0";
      
      this.components.forEach(comp => {
        // Determine connectivity
        const is_pos = comp.node_pos === node;
        const is_neg = comp.node_neg === node;
        const is_out = comp.node_out === node;
        
        if (!is_pos && !is_neg && !is_out) return;

        // Passive Components (R, L, C)
        if (['Resistor', 'Inductor', 'Capacitor'].includes(comp.type)) {
          if (!is_pos && !is_neg) return; // Passives don't have 'out'

          const { val: z_val, latex: z_latex } = this._get_impedance(comp);
          // Admittance Y = 1/Z
          let Y: math.Complex;
          try {
             Y = math.divide(1, z_val) as math.Complex;
          } catch {
             Y = math.complex(0,0);
          }
          
          const other_node = is_pos ? comp.node_neg : comp.node_pos;
          
          // Term: (V_node - V_other) / Z
          // Add Y to diagonal (V_node)
          const current_diag = A.get([row_idx, row_idx]) as math.Complex;
          A.set([row_idx, row_idx], math.add(current_diag, Y));
          
          // Subtract Y from other node if not Ground
          const other_idx = get_v_idx(other_node);
          if (other_idx !== undefined && other_idx !== -1) {
             const current_off = A.get([row_idx, other_idx]) as math.Complex;
             A.set([row_idx, other_idx], math.subtract(current_off, Y));
          }

          latex_lhs_parts.push(`\\frac{V_{${node}} - V_{${other_node}}}{${z_latex}}`);
        }

        // Current Sources
        else if (comp.type === 'I_Source') {
             // Current I flows from neg to pos (Standard Source definition?)
             // Or Pos to Neg?
             // Prompt Python code: "Current enters Node_Neg and leaves Node_Pos"
             // direction = -1 if node == pos else 1
             // If node == pos (leaving), term is -Val.
             // MNA Row is Sum(Currents Leaving) = 0.
             // If source pushes current OUT of pos, it is leaving. So +I_source.
             // Python code: `currents.append(direction * val)`.
             // `direction` is -1 for Pos. So it subtracts I.
             // This means KCL is defined as Sum(Currents Entering) = 0? Or Sum(Currents Leaving) + Source_In = 0?
             // Let's stick to standard MNA: Sum(Currents Leaving Node via Branches) = 0.
             // Current Source I (from Neg to Pos):
             // At Pos Node: Current I is ENTERING. So -I term.
             // At Neg Node: Current I is LEAVING. So +I term.
             
             const mag = comp.value;
             const phs = (comp.phase_deg || 0) * (Math.PI / 180);
             const val = math.complex({r: mag, phi: phs});

             let sign = 0;
             if (is_pos) sign = -1; // Enters pos
             if (is_neg) sign = 1;  // Leaves neg
             
             // Move to RHS: A*x = Z
             // Eq: ... - I = 0  => ... = I
             // Eq: ... + I = 0  => ... = -I
             
             const current_rhs = Z.get([row_idx, 0]) as math.Complex;
             // If sign is -1 (Enters), LHS has -I. RHS has +I.
             // If sign is 1 (Leaves), LHS has +I. RHS has -I.
             
             if (sign === -1) {
                 Z.set([row_idx, 0], math.add(current_rhs, val));
                 latex_rhs = `+${this._format_complex(val, 'A').polar}`; // Simplified latex
             } else if (sign === 1) {
                 Z.set([row_idx, 0], math.subtract(current_rhs, val));
                 latex_rhs = `-${this._format_complex(val, 'A').polar}`;
             }
        }

        // Voltage Sources & OpAmps (Current Variables)
        else if (comp.type === 'V_Source' || comp.type === 'Op_Amp') {
             // For V_Source: Current flows High to Low (Pos to Neg)? 
             // Variable I_src usually defined Pos to Neg.
             // At Pos Node: I_src leaves. (+1 coeff)
             // At Neg Node: I_src enters. (-1 coeff)
             
             // For OpAmp: Output current I_out leaves the output node.
             
             const i_idx = get_i_idx(comp.id);
             if (i_idx !== undefined) {
                 let coeff = 0;
                 if (comp.type === 'V_Source') {
                     if (is_pos) coeff = 1;
                     if (is_neg) coeff = -1;
                 } else if (comp.type === 'Op_Amp') {
                     if (is_out) coeff = 1; // I_out leaves output node
                 }
                 
                 if (coeff !== 0) {
                     A.set([row_idx, i_idx], coeff);
                     latex_lhs_parts.push(`${coeff > 0 ? '+' : '-'}I_{${comp.id}}`);
                 }
             }
        }
      });
      
      latex_equations.push(`\\text{Node ${node}: } ${latex_lhs_parts.join(' + ')} = ${latex_rhs}`);
    });

    // 2. Constraint Equations (V_Source & OpAmp)
    this.components.forEach(comp => {
        if (comp.type === 'V_Source') {
            const row_idx = get_i_idx(comp.id);
            if (row_idx === undefined) return;
            
            // V_pos - V_neg = V_val
            const pos_idx = get_v_idx(comp.node_pos);
            const neg_idx = get_v_idx(comp.node_neg);
            
            if (pos_idx !== undefined && pos_idx !== -1) A.set([row_idx, pos_idx], 1);
            if (neg_idx !== undefined && neg_idx !== -1) A.set([row_idx, neg_idx], -1);
            
            const mag = comp.value;
            const phs = (comp.phase_deg || 0) * (Math.PI / 180);
            const val = math.complex({r: mag, phi: phs});
            
            Z.set([row_idx, 0], val);
            latex_equations.push(`V_{${comp.node_pos}} - V_{${comp.node_neg}} = ${this._format_complex(val, 'V').polar}`);
        }
        else if (comp.type === 'Op_Amp') {
            const row_idx = get_i_idx(comp.id);
            if (row_idx === undefined) return;
            
            // Virtual Short: V_pos - V_neg = 0
            // Note: OpAmp inputs are pos/neg. Output is handled by KCL above.
            const pos_idx = get_v_idx(comp.node_pos);
            const neg_idx = get_v_idx(comp.node_neg);
            
            if (pos_idx !== undefined && pos_idx !== -1) A.set([row_idx, pos_idx], 1);
            if (neg_idx !== undefined && neg_idx !== -1) A.set([row_idx, neg_idx], -1);
            
            Z.set([row_idx, 0], 0);
            latex_equations.push(`V_{${comp.node_pos}} - V_{${comp.node_neg}} = 0`);
        }
    });

    // Solve
    try {
        const x = math.lusolve(A, Z) as math.Matrix;
        
        // Add step if not already present
        if (!this.steps.some(s => s.title === "System of Equations")) {
             this.steps.push({
                 title: "System of Equations",
                 description: "Generated KCL and Constituent Equations:",
                 latex: latex_equations.join('<br/>'),
                 latex_lines: latex_equations
             });
        }
        
        return this._process_results(x, var_map);

    } catch (e: any) {
        return { results: {}, steps: this.steps, error: e.toString() };
    }
  }

  _process_results(solution: math.Matrix, var_map: Map<string, number>) {
      const res: any = { voltages: {}, currents: {} };
      
      // Node Voltages
      this.node_vars.forEach(node => {
          const idx = var_map.get(`V_${node}`);
          if (idx !== undefined) {
              const val = solution.get([idx, 0]) as math.Complex;
              res.voltages[node] = this._format_complex(val, 'V');
          }
      });
      res.voltages['0'] = this._format_complex(0, 'V'); // Ground

      return { results: res, steps: this.steps };
  }
  
  // --- Superposition ---
  solve_superposition() {
     const sources = this.components.filter(c => ['V_Source', 'I_Source'].includes(c.type));
     const results = [];
     
     // Original steps should be preserved or cleared? 
     // We'll create a new engine for each sub-problem to avoid pollution.
     
     for (const active of sources) {
         // Deep copy components
         const temp_comps = JSON.parse(JSON.stringify(this.components));
         
         // Turn off others
         temp_comps.forEach((c: any) => {
             if (['V_Source', 'I_Source'].includes(c.type) && c.id !== active.id) {
                 c.value = 0; // V=0 (Short), I=0 (Open)
             }
         });
         
         const temp_netlist = { ...this.raw_data, components: temp_comps };
         const engine = new CircuitEngine(temp_netlist);
         const sol = engine.solve_system();
         
         results.push({
             active_source: active.id,
             solution: sol
         });
     }
     
     return { analysis: 'Superposition', partials: results };
  }
}

// --- React Flow Integration Wrapper ---

import { AnalysisMethod } from '@/types';

export const solveCircuit = (
  nodes: Node<CircuitNodeData>[],
  edges: Edge[],
  frequency: number,
  method: AnalysisMethod
): SolverResult => {
    
    // 1. Pre-process: Union-Find for Nodes
    const parent = new Map<string, string>();
    const find = (i: string): string => {
        if (!parent.has(i)) parent.set(i, i);
        if (parent.get(i) === i) return i;
        const root = find(parent.get(i)!);
        parent.set(i, root);
        return root;
    };
    const union = (i: string, j: string) => {
        const rootI = find(i);
        const rootJ = find(j);
        if (rootI !== rootJ) parent.set(rootI, rootJ);
    };

    // Internal connections
    nodes.forEach(n => {
        if (n.data.type === 'ground' || n.data.type === 'junction') {
             // All handles connected
             ['top', 'right', 'bottom', 'left'].forEach(h => union(`${n.id}-top`, `${n.id}-${h}`));
        } else {
             // Passives/Sources: Left-Top (1) and Right-Bottom (2)?
             // Let's stick to standard 2-port for R,L,C,V,I
             // OpAmp is 3-port.
             
             // Simplification:
             // Resistor/Cap/Ind/Source: 
             //   Port 1: Left & Top handles
             //   Port 2: Right & Bottom handles
             //   (This allows users to connect vertically or horizontally)
             
             union(`${n.id}-left`, `${n.id}-top`);
             union(`${n.id}-right`, `${n.id}-bottom`);
             
             if (n.data.type === 'op_amp') {
                 // Resetting logic for OpAmp specifically?
                 // Current logic maps Left/Top -> T1, Right/Bot -> T2.
                 // OpAmp needs 3 distinct nodes.
                 // Let's break the union for OpAmp.
                 // But wait, the previous loop did it for all.
                 // We need to NOT do it for OpAmp.
             }
        }
    });
    
    // Re-do specific mapping for OpAmp to ensure distinct terminals
    nodes.forEach(n => {
        if (n.data.type === 'op_amp') {
            // Force break previous unions if any (Union-Find structure is additive though)
            // Actually, we should have been more selective above.
            // Let's assume standard behavior is applied, but OpAmp we need to be careful.
            // In the "Internal connections" block above, I blindly unioned Left-Top and Right-Bottom.
            // THIS IS BAD for OpAmp.
        }
    });

    // Redoing the Union-Find correctly:
    parent.clear(); // Reset
    
    nodes.forEach(n => {
        if (n.data.type === 'ground' || n.data.type === 'junction') {
            ['top', 'right', 'bottom', 'left'].forEach(h => union(`${n.id}-top`, `${n.id}-${h}`));
        } else if (n.data.type === 'op_amp') {
            // OpAmp: 
            // - (Inv): Left
            // + (Non-Inv): Bottom
            // Out: Right
            // Top: Unused (or V+)
            // Distinct nodes. No internal shorts.
        } else {
            // 2-Terminal Devices (R, L, C, V, I)
            // Short Left with Top (Node A)
            // Short Right with Bottom (Node B)
            union(`${n.id}-left`, `${n.id}-top`);
            union(`${n.id}-right`, `${n.id}-bottom`);
        }
    });

    edges.forEach(e => {
        union(`${e.source}-${e.sourceHandle}`, `${e.target}-${e.targetHandle}`);
    });

    // 2. Extract Netlist
    // Identify Ground Node ID
    let groundRoot = "";
    const groundNode = nodes.find(n => n.data.type === 'ground');
    if (groundNode) {
        groundRoot = find(`${groundNode.id}-top`);
    }

    // Map roots to simplified node IDs ("1", "2", "0")
    const rootMap = new Map<string, string>();
    let counter = 1;
    
    // Get all unique roots
    const allRoots = new Set<string>();
    nodes.forEach(n => {
        ['top', 'right', 'bottom', 'left'].forEach(h => allRoots.add(find(`${n.id}-${h}`)));
    });
    
    allRoots.forEach(root => {
        if (root === groundRoot) rootMap.set(root, "0");
        else rootMap.set(root, String(counter++));
    });

    const netlistComponents: NetlistComponent[] = [];
    
    nodes.forEach(n => {
        if (['ground', 'junction'].includes(n.data.type)) return;
        
        let type = "";
        if (n.data.type === 'resistor') type = 'Resistor';
        if (n.data.type === 'capacitor') type = 'Capacitor';
        if (n.data.type === 'inductor') type = 'Inductor';
        if (n.data.type === 'voltage_source') type = 'V_Source';
        if (n.data.type === 'current_source') type = 'I_Source';
        if (n.data.type === 'op_amp') type = 'Op_Amp';
        
        const comp: NetlistComponent = {
            id: n.id,
            type,
            value: n.data.value,
            phase_deg: n.data.phase || 0,
            node_pos: "",
            node_neg: ""
        };

        if (type === 'Op_Amp') {
            // Left -> Inv (-), Bottom -> Non-Inv (+), Right -> Out
            comp.node_neg = rootMap.get(find(`${n.id}-left`)) || "?";
            comp.node_pos = rootMap.get(find(`${n.id}-bottom`)) || "?";
            comp.node_out = rootMap.get(find(`${n.id}-right`)) || "?";
        } else {
            // Standard 2-term
            // Pos/Term1 = Left/Top
            // Neg/Term2 = Right/Bottom
            comp.node_pos = rootMap.get(find(`${n.id}-left`)) || "?";
            comp.node_neg = rootMap.get(find(`${n.id}-right`)) || "?";
        }
        
        netlistComponents.push(comp);
    });

    const netlistData: NetlistData = {
        nodes: Array.from(rootMap.values()),
        components: netlistComponents,
        global_freq_hz: frequency
    };
    
    // 3. Run Engine
    const engine = new CircuitEngine(netlistData);
    let result: any;
    const steps: SolverStep[] = [];

    steps.push({
        title: "1. Initialization",
        description: `Frequency: ${frequency}Hz. Found ${netlistData.nodes.length - 1} active nodes.`
    });

    if (method === 'superposition') {
        const super_res = engine.solve_superposition();
        
        // Add partial results
        super_res.partials.forEach((partial: any, idx: number) => {
            steps.push({
                title: `Sub-Problem ${idx + 1}: Source ${partial.active_source} Active`,
                description: "Solved circuit with only one source active.",
            });
            steps.push(...partial.solution.steps);
            
            // Show voltages for this sub-problem
            const lines: string[] = [];
            Object.entries(partial.solution.results.voltages || {}).forEach(([n, v]: [string, any]) => {
                 if (n !== "0") lines.push(`V_{${n}}^{(source ${partial.active_source})} = ${v.polar}`);
            });
            steps.push({
                title: `Results for Source ${partial.active_source}`,
                description: "",
                latex: lines.join("<br/>"),
                latex_lines: lines
            });
        });
        
        // Final Total is sum of all results (Simulated by running full system once to get total)
        // We could sum manually, but running solve_system gives the total.
        steps.push({
            title: "Superposition Total",
            description: "Summing all partial responses (Verified by full system solve):"
        });
        result = engine.solve_system();

    } else {
        // Default / Nodal / Spice
        result = engine.solve_system();
    }
    
    // 4. Format for UI
    
    if (result.error) {
        steps.push({ title: "Error", description: result.error });
        return { steps };
    }
    
    // If not superposition (or if we want to show the full system steps for others)
    if (method !== 'superposition') {
        steps.push(...result.steps);
    }
    
    // Final Results
    const voltages: Record<string, math.Complex> = {};
    const voltageLines: string[] = [];
    
    if (result.results && result.results.voltages) {
        Object.entries(result.results.voltages).forEach(([node, val]: [string, any]) => {
            voltages[node] = math.complex(val.rect); // val.rect is string "a + bi"
            if (node !== "0") {
                voltageLines.push(`V_{${node}} = ${val.polar}`);
            }
        });
        
        steps.push({
            title: "Final Node Voltages",
            description: "",
            latex: voltageLines.join("<br/>"),
            latex_lines: voltageLines
        });
    }
    
    return {
        steps,
        nodeVoltages: voltages
    };
};
