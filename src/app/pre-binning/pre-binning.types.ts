export interface WarehouseOption {
    whsCode: string;
    whsName: string;
}

export interface WarehouseStockItem {
    itemCode: string;
    itemGroup: string;
    grnNo: string;
    availableQty: number;
    binnedQty: number;
    balanceQty: number;
}

export interface ParsedItemQr {
    itemCode: string;
    type: string;
    grnNo: string;
    itemGroup: string;
    uniqueNumber: string;
    qty: number;
}

export interface CurrentBoxItem extends ParsedItemQr {
    scanTime: string;
}

// Expected format: ITEMCODE|TYPE|GRN NO|ITEMGROUP|UNIQUE NUMBER|QTY
export function parseItemQr(raw: string): ParsedItemQr | null {
    if (!raw) {
        return null;
    }

    const parts = raw.split('|');
    if (parts.length !== 6) {
        return null;
    }

    const [itemCode, type, grnNo, itemGroup, uniqueNumber, qtyStr] = parts.map((p) => p.trim());
    if (!itemCode || !type || !grnNo || !itemGroup || !uniqueNumber || !qtyStr) {
        return null;
    }

    const qty = Number(qtyStr);
    if (!Number.isFinite(qty) || qty <= 0) {
        return null;
    }

    return { itemCode, type, grnNo, itemGroup, uniqueNumber, qty };
}
