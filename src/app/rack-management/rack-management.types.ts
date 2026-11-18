export type RackMode = 'STORE' | 'PICK';

// Mirrors GET /api/rack/rackwarehouses — only warehouses that have racks.
export interface RackWarehouse {
    warehouseCode: string;
    warehouseName: string;
    rackCount: number;
}

// Mirrors POST /api/rack/rackscan `data.rack`.
export interface RackInfo {
    locationId: number;
    rackCode: string;
    warehouseCode: string;
    rowCode: string;
    positionNo: number;
    status: string;
}

// Mirrors POST /api/rack/rackscan `data.stock[]` — what the rack currently holds.
export interface RackStockLine {
    rackInventoryId: number;
    itemCode: string;
    itemName: string | null;
    itemGroup: string | null;
    quantity: number;
    updatedAt: string | null;
}

// Mirrors POST /api/rack/rackitem `data.item`.
export interface RackScannedItem {
    itemCode: string;
    itemName: string | null;
    itemGroup: string | null;
    itemType: string | null;
    grnNo: string | null;
    uniqueNumber: string | null;
    tagged: boolean;
    itemQr: string | null;
    qty: number;
    availableQty: number;
}

// One row in the unsaved review grid. `key` is unique per row: the label identity for a tagged piece, the item code for an untagged one.
export interface RackScanLine extends RackScannedItem {
    key: string;
}

export interface RackSaveLinePayload {
    itemQr?: string;
    itemCode?: string;
    qty?: number;
}

export interface RackSavePayload {
    mode: RackMode;
    whsCode: string;
    rackCode: string;
    clientRequestId: string;
    deviceId: string;
    items: RackSaveLinePayload[];
}

export interface RackTransactionLine {
    lineNum: number;
    itemCode: string;
    itemName: string | null;
    itemGroup: string | null;
    itemType: string | null;
    grnNo: string | null;
    uniqueNumber: string | null;
    qty: number;
    qtyBefore: number;
    qtyAfter: number;
}

// Mirrors POST /api/rack/racksave and GET /api/rack/rackhistory(/:id).
export interface RackTransaction {
    transactionId: number;
    transactionNo: string;
    mode: RackMode;
    locationId: number;
    rackCode: string;
    warehouseCode: string;
    rowCode: string;
    totalLines: number;
    totalQty: number;
    deviceId: string | null;
    createdBy: string;
    createdAt: string;
    items?: RackTransactionLine[];
    duplicate?: boolean;
}

export interface RackHistoryQuery {
    mode?: RackMode | '';
    whsCode?: string;
    rackCode?: string;
    itemCode?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
}
