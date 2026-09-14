export type PalletPickingStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type ItemPickingStatus = 'PENDING' | 'PICKED';

// Mirrors the backend's items[] entry exactly (POST /api/picking/pick/pallet, /pick/box).
// The UI must not derive/compute these quantities — always use what the API returns.
export interface PickItemLine {
    inventoryId: number;
    palletMappingId: number;
    palletId: string;
    boxNumber: string;
    itemCode: string;
    itemName: string;
    itemGroup: string;
    availableQty: number;
    allocatedQty: number;
    pickableQty: number;
    warehouseCode: string;
    rowCode: string;
    locationId: number;
    locationCode: string;
    pickingStatus: ItemPickingStatus;
}

export interface PickPalletResponse {
    palletMappingId: number;
    palletId: string;
    palletNumber: string;
    palletStatus: string;
    pickingStatus: PalletPickingStatus;
    boxNumbers: string[];
    items: PickItemLine[];
}

export interface PickBoxResponse {
    boxNumber: string;
    items: PickItemLine[];
}

export interface CompletePickingResult {
    picking: {
        pickedQty: number;
        remainingQty: number;
        status: ItemPickingStatus;
        [key: string]: any;
    };
    pallet: {
        pickingStatus: PalletPickingStatus;
        [key: string]: any;
    };
    box: {
        remainingQty: number;
        pickingStatus: string;
        [key: string]: any;
    };
}
