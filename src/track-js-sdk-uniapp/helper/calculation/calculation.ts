/* eslint-disable */
import CalculationNode, { OPERATE_TYPE } from "./node";
import parsePath from "../../utils/parser/plugins/parsePath";
import { getDefaultData } from "../../utils/utils";

/**
 * 加减乘除计算规则
 * {
 *  type: CALCULATION_TYPE,
 *  left: calculationNode,
 *  right: calcutionNode,
 * }
 */
export default class Calculation {
  private currentNode: CalculationNode;

  private calculationNode: CalculationNode;

  constructor() {
    this.currentNode = new CalculationNode();
    this.calculationNode = this.currentNode;
  }

  private init() {
    this.currentNode = new CalculationNode();
    this.calculationNode = this.currentNode;
  }

  public done(json: Record<string, any>): any {
    const { value } = json;
    this.init();
    this.parser(value);
    return this.calc(this.calculationNode, json.data);
  }

  private calc(node: CalculationNode, data: Record<string, any>): any {
    let left: number | string = "";
    let right: number | string = "";
    if (node.left && node.type !== OPERATE_TYPE.DEFAULT) {
      left = this.calc(node.left, data);
    } else if (isNaN(Number(node.getValue()))) {
      left = parsePath({
        value: node.getValue(),
        data,
      });
    } else {
      left = +node.getValue();
    }

    if (node.right && node.type !== OPERATE_TYPE.DEFAULT) {
      right = this.calc(node.right, data);
    } else if (isNaN(Number(node.getValue()))) {
      right = parsePath({
        value: node.getValue(),
        data,
      });
    } else {
      right = +node.getValue();
    }

    return (this as any)[node.type](
      getDefaultData(left),
      getDefaultData(right)
    );
  }

  private parser(value: string) {
    for (let i = 0; i < value.length; i++) {
      const v = value[i];
      if (v === "(") {
        this.currentNode.confirmType();
        const node = new CalculationNode();
        node.preNode = this.currentNode;

        if (this.currentNode.left) {
          this.currentNode.right = node;
        } else {
          this.currentNode.left = node;
        }

        this.currentNode = node;
      } else if (v === ")") {
        this.currentNode = this.currentNode.preNode as CalculationNode;
      } else {
        this.currentNode.plusValue(v);
      }
    }
  }

  private [OPERATE_TYPE.AND](left: any, right: any) {
    return left && right;
  }

  private [OPERATE_TYPE.DIV](left: any, right: any) {
    return left / right;
  }

  private [OPERATE_TYPE.EQUAL](left: any, right: any) {
    // eslint-disable-next-line eqeqeq
    return left == right;
  }

  private [OPERATE_TYPE.MULT](left: any, right: any) {
    return left * right;
  }

  private [OPERATE_TYPE.NOT_EQUAL](left: any, right: any) {
    // eslint-disable-next-line eqeqeq
    return left != right;
  }

  private [OPERATE_TYPE.OR](left: any, right: any) {
    return left || right;
  }

  private [OPERATE_TYPE.PLUS](left: any, right: any) {
    return left + right;
  }

  private [OPERATE_TYPE.SUB](left: any, right: any) {
    return left - right;
  }

  private [OPERATE_TYPE.LESS_EUQAL](left: any, right: any) {
    return left <= right;
  }

  private [OPERATE_TYPE.LESS_THAN](left: any, right: any) {
    return left < right;
  }

  private [OPERATE_TYPE.MORE_EQUAL](left: any, right: any) {
    return left >= right;
  }

  private [OPERATE_TYPE.MORE_THAN](left: any, right: any) {
    return left > right;
  }

  private [OPERATE_TYPE.DEFAULT](left: any, right: any) {
    return left;
  }
}
