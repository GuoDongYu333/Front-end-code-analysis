
import { Component, Vue, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { carStatus, BaResponse } from 'quick-modules';
import APP, { userInfo } from 'framework';

const ADD_CARD ='m2'; 
const PUT_OR_CARS ='m3';
const GET_ACCOUNT_SETTINGS ='m4';

const AccountSettingModule = namespace('account-settings');
@Component
export default class Ba extends Vue {
  @AccountSettingModule.State('showCar')
  private showCar: {
    visible: boolean,
    editable: boolean,
    showDetail: boolean,
    value: {
      carInfo: BaResponse,
      oldcarInfo: BaResponse,
      isSaving: boolean,
      isDeleting: boolean
    }
  };

  @AccountSettingModule.Action(GET_ACCOUNT_SETTINGS)
  private getAccountSettings: () => void;

  @AccountSettingModule.Action(ADD_CARD)
  private addCard: () => void;

  @AccountSettingModule.Action(PUT_OR_CARS)
  private saveCards: () => void;

  private carStatus = carStatus;
  private isEdit: boolean[] = [];
  private unCar: boolean = false;

  /**
   * 是否Disabled添加按钮
   */
  get addDisabled(): boolean {
    let disabled = false;
    if (
      this.showCar.value.carInfo
      && this.showCar.value.carInfo.status === carStatus.Pending
    ) {
      disabled = true;
    }
    if (this.showCar.value.carInfo && this.showCar.value.carInfo.icInfo && this.showCar.value.carInfo.icInfo.length >= 3) {
      disabled = true;
    }
    return disabled;
  }

  get getUserName(): string {
    return userInfo.name;
  }

  private showEdit(index: number) {
    return this.isEdit[index];
  }

  /**
   * 新增
   */
  private add() {
    this.addCard();
    this.isEdit.push(true);
  }

  private editCard(index: number) {
    this.$set(this.isEdit, index, true);
  }

  private deleteUnSaveCard(index: number) {
    this.isEdit.splice(index, 1);
  }

  private deleteCard(index: number) {
    for (let i = 0; i < this.isEdit.length; i++) {
      this.$set(this.isEdit, i, false);
    }
  }

  private mounted() {
    if (!this.showCar.value.carInfo.icInfo.length) {
      this.add();
    } else {
      for (let i = 0; i < this.showCar.value.carInfo.icInfo.length; i++) {
        this.isEdit.push(false);
      }
    }
  }

  get disabledSave(): boolean {
    let disabled = false;
    this.showCar.value.carInfo.icInfo.forEach(card => {
      if (card.name === '' || card.cardNo === null || card.image === '') {
        disabled = true;
      }
    });
    if (this.showCar.value.carInfo && this.showCar.value.carInfo.status === carStatus.Pending) {
      disabled = true;
    }

    if (this.showCar.value.isSaving || this.showCar.value.isDeleting) {
      disabled = true;
    }
    return disabled;
  }

  private async save() {
    await this.saveCards();
    for (let i = 0; i < this.showCar.value.carInfo.icInfo.length; i++) {
      this.$set(this.isEdit, i, false);
    }
  }

  private confinrmCancel() {
    this.$confirm({
      title: this.$ice('leave_current_page'),
      confirmText: this.$ice('confirm'),
      cancelText: this.$ice('bt_cancel'),
      content: this.$ice('leave_current_page_confirm'),
      onConfirm(instance) {
        return new Promise(resolve => {
          resolve();
        });
      },
    }).then(async () => {
      this.$emit('closeCar');
    });
  }

  private async cancel() {
    if (this.unCar) {
      await this.confinrmCancel();
      return;
    }
    this.$emit('closeCar');
  }

  @Watch('isEdit', { deep: true })
  private update() {
    const { length } = this.isEdit.filter(element => element === true);
    this.unCar = !!length;
  }
}
