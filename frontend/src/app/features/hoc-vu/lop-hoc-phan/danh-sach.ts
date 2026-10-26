import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { LopHocPhan } from '@core/models/dao-tao.model';
import { BoLocLopHocPhan, LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { CotBang, DataTable, OTuyChinh, SapXep } from '@shared/ui/data-table';
import { PageHeader } from '@shared/ui/page-header';
import { Pagination } from '@shared/ui/pagination';
import { SearchInput } from '@shared/ui/search-input';
import { StatusBadge } from '@shared/ui/status-badge';
import { AppButton } from '@shared/ui/app-button';

type GiaTriLoc = { hocKy: string; mon: string; giangVien: string; namThu: string; trangThai: string; conCho: boolean };
type LuaChonLoc = { id: number; ten: string };

@Component({
  selector: 'app-lop-hoc-phan-danh-sach', standalone: true,
  imports: [AppButton, DataTable, OTuyChinh, PageHeader, Pagination, RouterLink, SearchInput, StatusBadge],
  template: `
    <app-page-header title="Lớp học phần" description="Theo dõi lớp mở theo môn học, học kỳ, giảng viên và sĩ số.">
      @if (laAdmin()) { <app-button variant="primary" routerLink="/lop-hoc-phan/them"><span class="material-icons">add</span> Mở lớp học phần</app-button> }
    </app-page-header>

    <section class="bo-loc" aria-label="Bộ lọc lớp học phần">
      <app-search-input placeholder="Tìm mã lớp, môn học, giảng viên…" [value]="tuKhoa()" (valueChange)="timKiem($event)" />
      <label><span>Học kỳ</span><select [value]="locTam().hocKy" (change)="doiLoc('hocKy', $event)"><option value="">Tất cả học kỳ</option>@for (item of hocKy(); track item.id) { <option [value]="item.id">{{ item.ten }}</option> }</select></label>
      <label><span>Môn học</span><select [value]="locTam().mon" (change)="doiLoc('mon', $event)"><option value="">Tất cả môn học</option>@for (item of monHoc(); track item.id) { <option [value]="item.id">{{ item.ten }}</option> }</select></label>
      <label><span>Giảng viên</span><select [value]="locTam().giangVien" (change)="doiLoc('giangVien', $event)"><option value="">Tất cả giảng viên</option>@for (item of giangVien(); track item.id) { <option [value]="item.id">{{ item.ten }}</option> }</select></label>
      <label><span>Năm thứ</span><select [value]="locTam().namThu" (change)="doiLoc('namThu', $event)"><option value="">Mọi năm</option><option value="1">Năm 1</option><option value="2">Năm 2</option><option value="3">Năm 3</option><option value="4">Năm 4</option></select></label>
      <label><span>Trạng thái</span><select [value]="locTam().trangThai" (change)="doiLoc('trangThai', $event)"><option value="">Tất cả trạng thái</option><option value="OPEN">Đang mở</option><option value="CLOSED">Đã đóng</option><option value="CANCELLED">Đã hủy</option></select></label>
      <label class="check"><input type="checkbox" [checked]="locTam().conCho" (change)="doiConCho($event)" /> Chỉ lớp còn chỗ</label>
      <div class="nut-loc"><app-button variant="secondary" size="sm" (click)="apDungLoc()">Áp dụng</app-button>@if (coLoc()) { <button type="button" (click)="xoaLoc()">Xóa lọc</button> }</div>
    </section>

    <app-data-table [cot]="cot()" [rows]="rows()" [dangTai]="dangTai()" [loi]="loi()" [sortBy]="sapXep().sort_by" [sortDir]="sapXep().sort_dir" [bamDong]="true" (sapXep)="doiSapXep($event)" (dongDuocBam)="moChiTiet($event)" (thuLai)="tai()" tieuDeRong="Không tìm thấy lớp học phần" [moTaRong]="coLoc() ? 'Thử thay đổi điều kiện lọc hoặc xóa bộ lọc.' : 'Chưa có lớp học phần nào.'">
      <ng-template appOTuyChinh="mon_hoc" let-row><div class="mon"><strong>{{ row.mon_hoc.ten_mon }}</strong><small>{{ row.mon_hoc.ma_mon }} · {{ row.mon_hoc.so_tin_chi }} tín chỉ</small></div></ng-template>
      <ng-template appOTuyChinh="hoc_ky" let-row><div class="phu"><strong>{{ row.hoc_ky.ten_hoc_ky }}</strong><small>{{ row.hoc_ky.nam_hoc }}</small></div></ng-template>
      <ng-template appOTuyChinh="giang_vien" let-row><div class="phu"><strong>{{ row.giang_vien.ho_ten }}</strong><small>{{ row.giang_vien.ma_gv }}</small></div></ng-template>
      <ng-template appOTuyChinh="nam_thu" let-row>{{ row.nam_thu ? 'Năm ' + row.nam_thu : 'Mọi năm' }}</ng-template>
      <ng-template appOTuyChinh="si_so" let-row><div class="si-so"><strong>{{ row.si_so_hien_tai }}/{{ row.si_so_toi_da }}</strong><span><i [style.width.%]="phanTram(row)"></i></span></div></ng-template>
      <ng-template appOTuyChinh="trang_thai" let-row><app-status-badge [value]="row.trang_thai" [label]="nhanTrangThai(row.trang_thai)" /></ng-template>
    </app-data-table>
    @if (meta(); as m) { <app-pagination [currentPage]="m.current_page" [perPage]="m.per_page" [total]="m.total" [lastPage]="m.last_page" (pageChange)="doiTrang($event)" (perPageChange)="doiCoTrang($event)" /> }
  `,
  styles: `
    :host{display:block}.bo-loc{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin-bottom:16px;padding:16px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)}app-search-input{flex:1 1 260px;max-width:380px}.bo-loc label{display:grid;gap:5px;color:var(--color-ink-muted);font-size:var(--text-caption);font-weight:600}.bo-loc select{min-width:145px;max-width:190px;padding:9px 10px;border:1px solid var(--color-border);border-radius:var(--radius);background:var(--color-surface);color:var(--color-ink);font:400 var(--text-small) var(--font-body)}.bo-loc .check{display:flex;align-items:center;gap:8px;padding:9px 2px;color:var(--color-ink);font-size:var(--text-small)}.check input{width:16px;height:16px;accent-color:var(--color-primary)}.nut-loc{display:flex;align-items:center;gap:8px}.nut-loc>button{border:0;background:transparent;color:var(--color-ink-muted);font:600 var(--text-small) var(--font-body);cursor:pointer}.nut-loc>button:hover{color:var(--color-danger)}.mon,.phu{display:grid;gap:3px;min-width:150px}.mon strong,.phu strong{font-size:var(--text-small);font-weight:600}.mon small,.phu small{color:var(--color-ink-muted);font-size:var(--text-caption)}.si-so{display:grid;gap:6px;min-width:76px;font-variant-numeric:tabular-nums}.si-so span{height:5px;overflow:hidden;border-radius:99px;background:var(--color-border-soft)}.si-so i{display:block;height:100%;border-radius:inherit;background:var(--color-primary)}@media(max-width:720px){.bo-loc{padding:12px}.bo-loc label,.bo-loc select,app-search-input{width:100%;max-width:none}.bo-loc select{max-width:none}.nut-loc{width:100%;justify-content:flex-end}}
  `,
})
export class LopHocPhanDanhSach {
  private readonly service = inject(LopHocPhanService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly laAdmin = computed(() => this.auth.nguoiDung()?.vai_tro === 'ADMIN');
  readonly rows = signal<LopHocPhan[]>([]); readonly meta = signal<any>(null); readonly dangTai = signal(true); readonly loi = signal<string | null>(null);
  readonly tuKhoa = signal(''); readonly locTam = signal<GiaTriLoc>({ hocKy:'', mon:'', giangVien:'', namThu:'', trangThai:'', conCho:false }); readonly loc = signal<GiaTriLoc>({ hocKy:'', mon:'', giangVien:'', namThu:'', trangThai:'', conCho:false });
  readonly sapXep = signal<SapXep>({ sort_by:'ma_lop_hp', sort_dir:'asc' }); private trang = 1; private coTrang = 10;
  readonly hocKy = signal<LuaChonLoc[]>([]); readonly monHoc = signal<LuaChonLoc[]>([]); readonly giangVien = signal<LuaChonLoc[]>([]);
  readonly cot = computed<CotBang<LopHocPhan>[]>(() => [{khoa:'ma_lop_hp',nhan:'Mã lớp',sap_xep:true,rong:'180px'},{khoa:'mon_hoc',nhan:'Môn học',rong:'220px'},{khoa:'hoc_ky',nhan:'Học kỳ',rong:'180px'},{khoa:'giang_vien',nhan:'Giảng viên',rong:'180px'},{khoa:'nam_thu',nhan:'Năm thứ',rong:'100px'},{khoa:'si_so',nhan:'Sĩ số',can_phai:true,rong:'105px'},{khoa:'trang_thai',nhan:'Trạng thái',rong:'135px'}]);
  readonly coLoc = computed(() => { const f=this.loc(); return !!(this.tuKhoa() || f.hocKy || f.mon || f.giangVien || f.namThu || f.trangThai || f.conCho); });
  constructor(){this.tai();this.taiTuyChon();}
  timKiem(value:string){this.tuKhoa.set(value);this.trang=1;this.tai();}
  doiLoc(key:keyof GiaTriLoc,event:Event){this.locTam.update(f=>({...f,[key]:(event.target as HTMLSelectElement).value}));}
  doiConCho(event:Event){this.locTam.update(f=>({...f,conCho:(event.target as HTMLInputElement).checked}));}
  apDungLoc(){this.loc.set(this.locTam());this.trang=1;this.tai();}
  xoaLoc(){const rong={hocKy:'',mon:'',giangVien:'',namThu:'',trangThai:'',conCho:false};this.tuKhoa.set('');this.locTam.set(rong);this.loc.set(rong);this.trang=1;this.tai();}
  doiSapXep(sort:SapXep){this.sapXep.set(sort);this.trang=1;this.tai();}
  doiTrang(page:number){this.trang=page;this.tai();} doiCoTrang(perPage:number){this.coTrang=perPage;this.trang=1;this.tai();}
  tai(){this.dangTai.set(true);this.loi.set(null);const f=this.loc();const s=this.sapXep();const p:BoLocLopHocPhan={page:this.trang,per_page:this.coTrang as 10|25|50|100,q:this.tuKhoa()||undefined,sort_by:s.sort_by,sort_dir:s.sort_dir,hoc_ky_id:this.so(f.hocKy),mon_hoc_id:this.so(f.mon),giang_vien_id:this.so(f.giangVien),nam_thu:this.so(f.namThu),trang_thai:(f.trangThai||undefined) as any,con_cho:f.conCho||undefined};this.service.layDanhSach(p).subscribe({next:r=>{this.rows.set(r.data);this.meta.set(r.meta);this.dangTai.set(false);},error:()=>{this.loi.set('Không tải được danh sách lớp học phần. Vui lòng thử lại.');this.dangTai.set(false);}});}
  moChiTiet(row:LopHocPhan){this.router.navigate(['/lop-hoc-phan', row.id]);}
  phanTram(row:LopHocPhan){return Math.min(100,Math.round(row.si_so_hien_tai/row.si_so_toi_da*100));}
  nhanTrangThai(s:LopHocPhan['trang_thai']){return s==='OPEN'?'Đang mở':s==='CLOSED'?'Đã đóng':'Đã hủy';}
  private so(value:string){return value?Number(value):undefined;}
  private taiTuyChon(){this.service.layTuyChon('semesters').subscribe({next:rows=>this.hocKy.set(rows.map(r=>({id:r.id,ten:r.label})))});this.service.layTuyChon('subjects').subscribe({next:rows=>this.monHoc.set(rows.map(r=>({id:r.id,ten:r.label})))});this.service.layTuyChon('teachers').subscribe({next:rows=>this.giangVien.set(rows.map(r=>({id:r.id,ten:r.label})))});}
}
