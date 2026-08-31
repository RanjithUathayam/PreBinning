export interface CurrentPalletBox {
    boxNumber: string;
    warehouseCode?: string | null;
    itemGroup?: string | null;
    boxTotalQty?: number | null;
    mappedBy?: string;
    mappedAt?: string;
}
