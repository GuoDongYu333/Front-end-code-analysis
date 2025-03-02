
/* eslint-disable @typescript-eslint/no-explicit-any, no-shadow */
import { Component, Vue, Prop } from 'vue-property-decorator';
import { SeCar } from 'common-components';
import { notiService, NotificationSettingResponse } from 'quick-modules';
import { AppRequest as request } from 'framework';

@Component({
  components: {
    SeCar: SeCar.default,
    SeCarHeader: SeCar.header,
    SeCarRow: SeCar.row,
  },
})
export default class NotificationSetting extends Vue {
  @Prop() private canEditSetting: boolean;
  private notificationState: NotificationSettingResponse = {} as NotificationSettingResponse;
  private pnOption = {} as { [key: string]: { [key: string]: boolean | any } };
  private pEnable = { ...this.pnOption };

  private async updateNotificationSettings({ command, value }: { command: string, value: boolean }) {
    this.$set(this.pEnable[command], 'value', value);
    try {
      const { error } = await notiService.updateNotificationSetting({ [command]: value });
      if (!error) {
        this.$set(this.pnOption[command], 'value', value);
        this.$user.$reload();
      } else {
        this.pEnable[command] = { ...this.pnOption[command] };
      }
    } catch (e) {
      this.pEnable[command] = { ...this.pnOption[command] };
    }
  }

  private async created() {
    try {
      const { data } = await notiService.getNotificationSetting();
      if (data && request.isRight) {
        this.notificationState = data;
        Object.keys(this.notificationState).forEach((key: string) => {
          const subModuleObj = { ...(this.notificationState as any)[key].subModuleObj };
          const { visible, value } = (this.notificationState as any)[key];
          this.pnOption[key] = { visible, value };
          Object.keys(subModuleObj).forEach((key: string) => {
            this.pnOption[key] = subModuleObj[key];
          });
        });
        this.pEnable = JSON.parse(JSON.stringify(this.pnOption));
      }
    } catch (error) {}
  }
}
