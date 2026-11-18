import { Component, Input, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RackManagementApiService } from '../../services/rack-management-api.service';
import { RackHistoryQuery, RackMode, RackTransaction, RackTransactionLine, RackWarehouse } from '../../rack-management.types';

const PAGE_SIZE = 20;

@Component({
    selector: 'app-rm-rack-history',
    templateUrl: './rack-history.component.html',
    styleUrls: ['./rack-history.component.scss'],
    providers: [DatePipe]
})
export class RackHistoryComponent implements OnInit {

    @Input() mode: RackMode | '' = '';
    @Input() warehouses: RackWarehouse[] = [];
    @Input() whsCode: string | null = null;

    filters: RackHistoryQuery = {};
    rows: RackTransaction[] = [];
    page = 1;
    total = 0;
    loading = false;
    errorMessage = '';

    expandedId: number | null = null;
    detailLines: RackTransactionLine[] = [];
    detailLoading = false;

    constructor(private rackApi: RackManagementApiService, private datePipe: DatePipe) { }

    get totalPages(): number {
        return Math.max(Math.ceil(this.total / PAGE_SIZE), 1);
    }

    ngOnInit(): void {
        const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '';
        this.filters = { mode: this.mode, whsCode: this.whsCode || '', fromDate: today, toDate: today, rackCode: '', itemCode: '' };
        this.search(1);
    }

    /** Re-runs the current search (used after a save so the new transaction shows up). */
    refresh() {
        this.search(this.page);
    }

    search(page: number) {
        this.loading = true;
        this.errorMessage = '';
        this.expandedId = null;
        this.rackApi.getHistory({
            ...this.filters,
            rackCode: (this.filters.rackCode || '').trim(),
            itemCode: (this.filters.itemCode || '').trim(),
            page,
            pageSize: PAGE_SIZE
        }).subscribe({
            next: (res: any) => {
                this.loading = false;
                if (res && res.success) {
                    this.rows = res.data?.rows || [];
                    this.total = res.data?.total || 0;
                    this.page = res.data?.page || page;
                } else {
                    this.rows = [];
                    this.total = 0;
                    this.errorMessage = res?.message || 'Unable to load transaction history.';
                }
            },
            error: (err: any) => {
                this.loading = false;
                this.errorMessage = err?.error?.message || 'Unable to load transaction history.';
            }
        });
    }

    toggle(row: RackTransaction) {
        if (this.expandedId === row.transactionId) {
            this.expandedId = null;
            return;
        }
        this.expandedId = row.transactionId;
        this.detailLines = [];
        this.detailLoading = true;
        this.rackApi.getHistoryDetail(row.transactionId).subscribe({
            next: (res: any) => {
                this.detailLoading = false;
                this.detailLines = (res && res.success && res.data?.items) || [];
            },
            error: () => {
                this.detailLoading = false;
                this.detailLines = [];
            }
        });
    }
}
