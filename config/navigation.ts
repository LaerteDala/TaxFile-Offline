
import {
    LayoutDashboard,
    Users,
    FileText,
    BarChart3,
    SearchCode,
    Settings as SettingsIcon,
    Coins,
    Percent,
    Home,
    Car,
    Banknote,
    Landmark,
    FileSpreadsheet,
    Truck,
    UserPlus,
    Contact,
    Folder,
    FileSignature,
    Wallet,
    History,
    ArrowLeftRight,
    PieChart,
    MapPin,
    Building2,
    ShoppingBag,
    ShoppingCart,
    CreditCard,
    Store,
    Briefcase,
    LayoutGrid
} from 'lucide-react';
import { View } from '../types';

export interface NavItem {
    name: string;
    icon: any;
    view?: View;
    id?: string;
    subItems?: NavItem[];
}

export const settingsMenu: NavItem = {
    name: 'Definições',
    icon: SettingsIcon,
    id: 'settings_menu',
    view: 'settings' as View
};

export const settingsRelatedViews: View[] = [
    'settings',
    'fiscal_parameters',
    'irt_table',
    'subsidies',
    'company_settings',
    'provinces',
    'municipalities',
    'departments',
    'job_functions'
];

export const navigation: NavItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' as View },
    { name: 'Consulta', icon: SearchCode, view: 'inquiry' as View },
    { name: 'Relatórios', icon: BarChart3, view: 'reports' as View },
    {
        name: 'Conta corrente',
        icon: Wallet,
        id: 'conta_corrente',
        subItems: [
            { name: 'Extracto', icon: History, view: 'cc_statement' as View },
            { name: 'Operações', icon: ArrowLeftRight, view: 'cc_operations' as View },
            { name: 'Relatórios', icon: PieChart, view: 'cc_reports' as View },
        ]
    },
    {
        name: 'Entidades',
        icon: Users,
        id: 'entidade',
        subItems: [
            { name: 'Fornecedores', icon: Truck, view: 'suppliers' as View },
            { name: 'Clientes', icon: UserPlus, view: 'clients' as View },
            { name: 'Pessoal', icon: Contact, view: 'staff' as View },
        ]
    },
    {
        name: 'Documentos',
        icon: Folder,
        id: 'documentos',
        subItems: [
            { name: 'Facturas', icon: FileText, view: 'invoices' as View },
            { name: 'Contratos', icon: FileSignature, view: 'contracts' as View },
        ]
    },
    {
        name: 'Comercial',
        icon: Store,
        id: 'comercial',
        subItems: [
            { name: 'Vendas', icon: ShoppingBag, view: 'sales' as View },
            { name: 'Compras', icon: ShoppingCart, view: 'purchases' as View },
            { name: 'Conta Corrente', icon: CreditCard, view: 'commercial_cc' as View },
        ]
    },
    {
        name: 'I. Industrial',
        icon: Landmark,
        id: 'tax_ii',
        subItems: [
            { name: 'Mapa de Retenção', icon: FileSpreadsheet, view: 'ii_withholding_map' as View },
            { name: 'Valores Retidos', icon: Coins, view: 'ii_withheld_values' as View },
            { name: 'Relatórios', icon: BarChart3, view: 'ii_reports' as View },
        ]
    },
    { name: 'I. Selo', icon: Coins, view: 'tax_is' as View },
    {
        name: 'IR. Trabalho',
        icon: Percent,
        id: 'tax_irt',
        subItems: [
            { name: 'Mapa de Retenção', icon: FileSpreadsheet, view: 'irt_withholding_map' as View },
            { name: 'Valores Retidos', icon: Coins, view: 'irt_withheld_values' as View },
            { name: 'Mapa de Remunerações', icon: FileSpreadsheet, view: 'irt_remuneration_map' as View },
            { name: 'Relatórios', icon: BarChart3, view: 'irt_reports' as View },
        ]
    },
    {
        name: 'IV. Acrescentado',
        icon: FileSpreadsheet,
        id: 'tax_iva',
        subItems: [
            { name: 'Consolidação do IVA', icon: FileSpreadsheet, view: 'tax_iva' as View },
        ]
    },
    {
        name: 'I. Predial',
        icon: Home,
        id: 'tax_ip',
        subItems: [
            { name: 'Mapa de Retenção', icon: FileSpreadsheet, view: 'ip_withholding_map' as View },
            { name: 'Valores Retidos', icon: Coins, view: 'ip_withheld_values' as View },
            { name: 'Relatórios', icon: BarChart3, view: 'ip_reports' as View },
        ]
    },
    { name: 'IV. Motorizados', icon: Car, view: 'tax_ivm' as View },
    { name: 'IA. Capitais', icon: Banknote, view: 'tax_iac' as View },
];
