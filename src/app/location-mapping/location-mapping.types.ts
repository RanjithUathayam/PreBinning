export interface WarehouseOption {
    whsCode: string;
    whsName: string;
}

export interface RowOption {
    rowCode: string;
    rowName?: string;
}

export interface PositionOption {
    positionNo: string;
    locationCode: string;
}

export interface PalletLocationDetails {
    palletId: string;
    palletStatus: string;
    boxCount: number;
    totalQty: number;
    inventoryStatus: string;
}

export interface MappedLocationEntry {
    palletId: string;
    locationCode: string;
    boxCount: number;
    totalQty: number;
    inventoryStatus: string;
    mappedTime: string;
}
