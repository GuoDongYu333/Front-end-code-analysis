
import { State, namespace } from "vuex-class";
import { Component, Vue, Prop, Watch, Emit } from "vue-property-decorator";
import { environment } from "framework";

const ProductState = namespace("productsStore");
const defaultSearchForm = {
  kind_ids: [""],
  itemIds: [],
  field: "item_names",
  value: "",
  available_only: true,
};

const defaultPager = {
  count: 20,
  page_no: 1,
  total: 0,
};

interface Pager {
  count: number;
  page_no: number;
  total: number;
}

interface BatchConfig {
  actionUrl: string;
  errorField: string;
  listField: string;
  actionData?: any;
  isky?: boolean;
}

@Component
export default class AddVariationDialog extends Vue {
  @Prop(Boolean) dialogVisible: boolean;
  @Prop(Array) productOptions: any[];
  @Prop(Object) pager: Pager;
  @Prop(Array) itemList: any[];
  @Prop(Boolean) loading: boolean;
  @Prop(String) defaultField: string;
  @Prop(String) availableOnlyTip: string;
  @Prop(Object) batchConfig: BatchConfig;

  addDialogVisible: boolean = false;
  searchForm = defaultSearchForm;
  hasSelect: boolean = false;
  expandList: string[] = [];
  kyList: any[] = [];
  selectedList: string[] = [];
  selectedRows: any[] = [];
  activeTab: string = "";
  kindTree: any[] = [{ label: this.$kh("addAllCategories"), value: "" }];
  @Emit("close")
  closeDialog() {
    this.addDialogVisible = false;
  }

  openDialog() {
    this.addDialogVisible = true;
  }

  addVariations() {
    this.$emit("addVariation", this.selectedRows, "select");
    this.$emit("close");
  }

  addBatchVariations(kyList) {
    this.$emit("addVariation", kyList, "batch");
    this.$emit("close");
  }

  getRowClassName(row) {
    return row.kyList && row.kyList.length ? "item-row" : "ky-row";
  }

  selectAllChange(value) {
    this.selectRows(value ? this.kyList : []);
  }

  getCheckValue(row) {
    const selectedList = this.selectedList;
    if (row.kyList && row.kyList.length) {
      return row.kyList.some((item) =>
        selectedList.includes(item.kyId || item.itemId)
      );
    } else {
      return selectedList.includes(row.kyId || row.itemId);
    }
  }

  getCheckStatus(row) {
    const selectedList = this.selectedList;
    if (row.kyList && row.kyList.length) {
      const filterList = row.kyList.filter((item) =>
        selectedList.includes(item.kyId || item.itemId)
      );
      return !!filterList.length && filterList.length !== row.kyList.length;
    } else {
      return false;
    }
  }

  selectRows(list, value?) {
    const rows = list.map((item) => item.kyId || item.itemId);
    const set = new Set(this.selectedList);
    if (value !== undefined) {
      if (value === true) {
        list.forEach((item) => {
          set.add(item.kyId || item.itemId);
        });
      } else {
        list.forEach((item) => {
          set.delete(item.kyId || item.itemId);
          const selectedIndex = this.selectedRows.findIndex(
            (ky) => (ky.kyId || ky.itemId) === (item.kyId || item.itemId)
          );
          if (selectedIndex > -1) {
            this.selectedRows.splice(selectedIndex, 1);
          }
        });
      }
      set.delete((list[0] || {}).itemId);
    } else {
      this.kyList.forEach((item) => {
        if (rows.includes(item.kyId || item.itemId) && !item.kyList) {
          set.add(item.kyId || item.itemId);
        } else {
          set.delete(item.kyId || item.itemId);
          const selectedIndex = this.selectedRows.findIndex(
            (ky) => (ky.kyId || ky.itemId) === (item.kyId || item.itemId)
          );
          if (selectedIndex > -1) {
            this.selectedRows.splice(selectedIndex, 1);
          }
        }
      });
    }
    this.selectedList = [...set];
    const selectedRows = this.selectedRows;
    const currentSelectedRows = this.kyList.filter((item) =>
      set.has(item.kyId || item.itemId)
    );
    this.selectedRows = selectedRows.concat(
      currentSelectedRows.filter(
        (row) =>
          !selectedRows.find((item) => {
            return (row.kyId || row.itemId) === (item.kyId || item.itemId);
          })
      )
    );
    this.hasSelect = !!currentSelectedRows.length;
  }

  changekind(value) {
    if (value.length === 0) {
      this.searchForm.kind_ids = [""];
    }
    this.searchProduct();
  }

  switchItemExpand(row) {
    const set = new Set(this.expandList);
    if (set.has(row.itemId)) {
      set.delete(row.itemId);
    } else {
      set.add(row.itemId);
    }
    this.expandList = [...set];
  }

  searchProduct() {
    this.$emit("getAddDialogProducts", {
      page_no: 1,
      form: this.searchForm,
    });
  }

  onPageChange(page) {
    this.$emit("getAddDialogProducts", {
      page_no: page,
      form: this.searchForm,
    });
  }

  get canClearkind() {
    return !!this.searchForm.kind_ids.filter((item) => item !== "").length;
  }

  get currentList() {
    const list = this.expandList;
    return this.kyList.filter(
      (item) => item.kyList || list.includes(item.itemId)
    );
  }

  get isPartSelect() {
    const selectedList = this.selectedList || [];
    const filterList = this.kyList.filter((item) =>
      selectedList.includes(item.kyId || item.itemId)
    );
    return (
      !!filterList.length &&
      filterList.length !== this.kyList.filter((ky) => !ky.kyList).length
    );
  }

  @Watch("dialogVisible", { immediate: true })
  onDialogVisibleChange(visible: boolean) {
    this.addDialogVisible = visible;
    if (visible) {
      this.searchForm = { ...defaultSearchForm, field: this.defaultField };
      this.hasSelect = false;
      this.expandList = [];
      this.kyList = [];
      this.selectedList = [];
      this.selectedRows = [];
      this.activeTab = "select";
      const newArr: any = [];
      this.searchProduct();

      if (!this.kindTree.filter((item) => !!item.value).length) {
        const arr = [];
        this.kindTree = [
          { label: this.$kh("addAllCategories"), value: "" },
          ...arr,
        ];
      }
    }
  }

  @Watch("searchForm.value")
  onValueChange(nv: boolean) {
    if (!nv) {
      this.searchProduct();
    }
  }

  @Watch("itemList", { immediate: true, deep: true })
  onItemListChange() {
    const kyList: any[] = [];
    this.itemList.forEach((item) =>
      kyList.push(
        item,
        ...(item.kyList || []).map((ky) => ({
          ...ky,
          isChild: true,
          itemId: item.itemId,
          itemName: item.itemName,
          itemImage: item.itemImage,
        }))
      )
    );
    this.kyList = kyList.map((item, index) => {
      return {
        ...item,
        barcode: item.barcode || "",
      };
    });

    this.expandList = this.itemList
      .filter((item) => !item.kyList)
      .map((item) => item.itemId);
    this.hasSelect = kyList.some((item) =>
      this.selectedList.includes(item.kyId || item.itemId)
    );
  }

  downloadTemplate() {
    this.$emit("downloadTemplate");
  }
}
