import _JSON$stringify from "@babel/runtime-corejs3/core-js/json/stringify";
import { logger } from "../../lib/logger";
export const handler = async (event, context) => {
  logger.info('Invoked healtz function');
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: _JSON$stringify({
      data: 'healthz function'
    })
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL2FwaS9zcmMvZnVuY3Rpb25zL2hlYWx0aHovaGVhbHRoei5qcyJdLCJuYW1lcyI6WyJsb2dnZXIiLCJoYW5kbGVyIiwiZXZlbnQiLCJjb250ZXh0IiwiaW5mbyIsInN0YXR1c0NvZGUiLCJoZWFkZXJzIiwiYm9keSIsImRhdGEiXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxNQUFUO0FBRUEsT0FBTyxNQUFNQyxPQUFPLEdBQUcsT0FBT0MsS0FBUCxFQUFjQyxPQUFkLEtBQTBCO0FBQy9DSCxFQUFBQSxNQUFNLENBQUNJLElBQVAsQ0FBWSx5QkFBWjtBQUVBLFNBQU87QUFDTEMsSUFBQUEsVUFBVSxFQUFFLEdBRFA7QUFFTEMsSUFBQUEsT0FBTyxFQUFFO0FBQ1Asc0JBQWdCO0FBRFQsS0FGSjtBQUtMQyxJQUFBQSxJQUFJLEVBQUUsZ0JBQWU7QUFDbkJDLE1BQUFBLElBQUksRUFBRTtBQURhLEtBQWY7QUFMRCxHQUFQO0FBU0QsQ0FaTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGxvZ2dlciB9IGZyb20gJ3NyYy9saWIvbG9nZ2VyJ1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudCwgY29udGV4dCkgPT4ge1xuICBsb2dnZXIuaW5mbygnSW52b2tlZCBoZWFsdHogZnVuY3Rpb24nKVxuXG4gIHJldHVybiB7XG4gICAgc3RhdHVzQ29kZTogMjAwLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgfSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBkYXRhOiAnaGVhbHRoeiBmdW5jdGlvbicsXG4gICAgfSksXG4gIH1cbn1cbiJdfQ==