
interface Option {
  label:string; // After Translation Label
  value:string;
}
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { ActivePage } from 'framework';

@Component({
  components: {}
})
export default class InventoryIndex extends Vue {// READ ME
  @Prop({type: Array, required: true}) tabList: Option[]; // Tab List
  @Prop({type:Array, default: []}) alertList: any[]; 
  @Prop({type: String, required: true}) value: string; 
  @Prop({type: Boolean, default: true}) isSticky: boolean; //是否吸顶，默认为true
  private tabEl:any = null;
  private timer:number = 0;

  scrollCallback() {
    this.isFixed  = this.tabEl.getBoundingClientRect().top <= 56;
  }
  @Watch('value', {immediate: true})
  onValueChange(value:string) {
    this.activeTab = value;
  }

  tabClick(value:any) {
    const page = new ActivePage();
    const tab = this.value;
    this.$emit('tabClick', value);
    if(tab !== value) {
      return page;
    }
  }
}
