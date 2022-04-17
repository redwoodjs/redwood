import _JSON$stringify from "@babel/runtime-corejs3/core-js/json/stringify";
import { logger } from "../../lib/logger";
export const handler = async (event, context) => {
  logger.info('Invoked nested function');
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: _JSON$stringify({
      data: 'nested function'
    })
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL2FwaS9zcmMvZnVuY3Rpb25zL25lc3RlZC9uZXN0ZWQudHMiXSwibmFtZXMiOlsibG9nZ2VyIiwiaGFuZGxlciIsImV2ZW50IiwiY29udGV4dCIsImluZm8iLCJzdGF0dXNDb2RlIiwiaGVhZGVycyIsImJvZHkiLCJkYXRhIl0sIm1hcHBpbmdzIjoiO0FBQUEsU0FBU0EsTUFBVDtBQUVBLE9BQU8sTUFBTUMsT0FBTyxHQUFHLE9BQU9DLEtBQVAsRUFBY0MsT0FBZCxLQUEwQjtBQUMvQ0gsRUFBQUEsTUFBTSxDQUFDSSxJQUFQLENBQVkseUJBQVo7QUFFQSxTQUFPO0FBQ0xDLElBQUFBLFVBQVUsRUFBRSxHQURQO0FBRUxDLElBQUFBLE9BQU8sRUFBRTtBQUNQLHNCQUFnQjtBQURULEtBRko7QUFLTEMsSUFBQUEsSUFBSSxFQUFFLGdCQUFlO0FBQ25CQyxNQUFBQSxJQUFJLEVBQUU7QUFEYSxLQUFmO0FBTEQsR0FBUDtBQVNELENBWk0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBsb2dnZXIgfSBmcm9tICdzcmMvbGliL2xvZ2dlcidcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQsIGNvbnRleHQpID0+IHtcbiAgbG9nZ2VyLmluZm8oJ0ludm9rZWQgbmVzdGVkIGZ1bmN0aW9uJylcblxuICByZXR1cm4ge1xuICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgIH0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgZGF0YTogJ25lc3RlZCBmdW5jdGlvbicsXG4gICAgfSksXG4gIH1cbn1cbiJdfQ==