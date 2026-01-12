import { Subsidy, IRTScale } from '../types';

export interface PayrollInput {
    baseSalary: number;
    overtime: number;
    deductions: number;
    subsidies: {
        subsidyId: string;
        amount: number;
    }[];
    manualExcessBool: boolean;
    manualExcessValue: number;
}

export interface PayrollResult {
    grossSalary: number;

    totalNonSubjectSubsidies: number;
    totalSubjectSubsidies: number;

    inssBase: number;
    inssValue: number;

    irtBase: number;
    irtScaleId: string | null;
    irtValue: number;
    irtParcelaFixa: number;
    irtTaxa: number;
    irtExcesso: number;

    netSalary: number;
}

export const calculatePayroll = (
    input: PayrollInput,
    allSubsidies: Subsidy[],
    irtScales: IRTScale[],
    staffSubjectToINSS: boolean = true,
    staffSubjectToIRT: boolean = true,
    isRetired: boolean = false
): PayrollResult => {
    let totalNonSubjectSubsidies = 0;
    let totalSubjectSubsidies = 0;

    // 1. Calculate Subsidies Parts
    input.subsidies.forEach(item => {
        const subsidy = allSubsidies.find(s => s.id === item.subsidyId);
        if (!subsidy) return;

        let inssExemptPart = 0;
        let irtExemptPart = 0;

        // INSS Exempt Part Calculation
        if (subsidy.subject_to_inss === 0) {
            inssExemptPart = item.amount;
        } else {
            if (subsidy.inss_limit_type === 'fixed') {
                inssExemptPart = Math.min(item.amount, subsidy.inss_limit_value);
            } else if (subsidy.inss_limit_type === 'percentage') {
                const limit = input.baseSalary * (subsidy.inss_limit_value / 100);
                inssExemptPart = Math.min(item.amount, limit);
            } else {
                inssExemptPart = 0;
            }
        }

        // IRT Exempt Part Calculation
        if (subsidy.subject_to_irt === 0) {
            irtExemptPart = item.amount;
        } else {
            if (subsidy.irt_limit_type === 'fixed') {
                irtExemptPart = Math.min(item.amount, subsidy.irt_limit_value);
            } else if (subsidy.irt_limit_type === 'percentage') {
                const limit = input.baseSalary * (subsidy.irt_limit_value / 100);
                irtExemptPart = Math.min(item.amount, limit);
            } else {
                irtExemptPart = 0;
            }
        }

        // Accumulate totals
        totalNonSubjectSubsidies += irtExemptPart;
        totalSubjectSubsidies += (item.amount - irtExemptPart);
    });

    // 2. Gross Salary
    const totalSubsidies = input.subsidies.reduce((sum, s) => sum + s.amount, 0);
    const grossSalary = input.baseSalary + input.overtime - input.deductions + totalSubsidies;

    // 3. INSS
    let totalINSSExempt = 0;
    input.subsidies.forEach(item => {
        const subsidy = allSubsidies.find(s => s.id === item.subsidyId);
        if (!subsidy) return;

        let exempt = 0;
        if (subsidy.subject_to_inss === 0) {
            exempt = item.amount;
        } else {
            if (subsidy.inss_limit_type === 'fixed') {
                exempt = Math.min(item.amount, subsidy.inss_limit_value);
            } else if (subsidy.inss_limit_type === 'percentage') {
                const limit = input.baseSalary * (subsidy.inss_limit_value / 100);
                exempt = Math.min(item.amount, limit);
            }
        }
        totalINSSExempt += exempt;
    });

    const inssBase = staffSubjectToINSS ? Math.max(0, grossSalary - totalINSSExempt) : 0;

    // Reformados não pagam os 3%
    const inssValue = (staffSubjectToINSS && !isRetired) ? inssBase * 0.03 : 0;

    // 4. IRT
    const irtBase = Math.max(0, grossSalary - inssValue - totalNonSubjectSubsidies);

    // Find Scale
    const scale = irtScales.find(s => {
        if (s.valor_final === null) return irtBase >= s.valor_inicial;
        return irtBase >= s.valor_inicial && irtBase <= s.valor_final;
    });

    let irtValue = 0;
    let irtParcelaFixa = 0;
    let irtTaxa = 0;
    let irtExcesso = 0;

    if (scale && staffSubjectToIRT) {
        irtParcelaFixa = scale.parcela_fixa;
        irtTaxa = scale.taxa;
        irtExcesso = scale.excesso;
        irtValue = ((irtBase - irtExcesso) * (irtTaxa / 100)) + irtParcelaFixa;
    }

    // 5. Net Salary
    const netSalary = grossSalary - inssValue - irtValue;

    return {
        grossSalary,
        totalNonSubjectSubsidies,
        totalSubjectSubsidies,
        inssBase,
        inssValue,
        irtBase,
        irtScaleId: scale ? scale.id : null,
        irtValue,
        irtParcelaFixa,
        irtTaxa,
        irtExcesso,
        netSalary
    };
};
