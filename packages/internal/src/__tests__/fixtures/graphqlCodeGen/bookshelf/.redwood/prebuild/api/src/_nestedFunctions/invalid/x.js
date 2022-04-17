import _JSON$stringify from "@babel/runtime-corejs3/core-js/json/stringify";
import { logger } from "../../lib/logger";
export const handler = async (event, context) => {
  logger.info('Invoked x function');
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: _JSON$stringify({
      data: 'x function'
    })
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL2FwaS9zcmMvZnVuY3Rpb25zL2ludmFsaWQveC5qcyJdLCJuYW1lcyI6WyJsb2dnZXIiLCJoYW5kbGVyIiwiZXZlbnQiLCJjb250ZXh0IiwiaW5mbyIsInN0YXR1c0NvZGUiLCJoZWFkZXJzIiwiYm9keSIsImRhdGEiXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxNQUFUO0FBRUEsT0FBTyxNQUFNQyxPQUFPLEdBQUcsT0FBT0MsS0FBUCxFQUFjQyxPQUFkLEtBQTBCO0FBQy9DSCxFQUFBQSxNQUFNLENBQUNJLElBQVAsQ0FBWSxvQkFBWjtBQUVBLFNBQU87QUFDTEMsSUFBQUEsVUFBVSxFQUFFLEdBRFA7QUFFTEMsSUFBQUEsT0FBTyxFQUFFO0FBQ1Asc0JBQWdCO0FBRFQsS0FGSjtBQUtMQyxJQUFBQSxJQUFJLEVBQUUsZ0JBQWU7QUFDbkJDLE1BQUFBLElBQUksRUFBRTtBQURhLEtBQWY7QUFMRCxHQUFQO0FBU0QsQ0FaTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGxvZ2dlciB9IGZyb20gJ3NyYy9saWIvbG9nZ2VyJ1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudCwgY29udGV4dCkgPT4ge1xuICBsb2dnZXIuaW5mbygnSW52b2tlZCB4IGZ1bmN0aW9uJylcblxuICByZXR1cm4ge1xuICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgIH0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgZGF0YTogJ3ggZnVuY3Rpb24nLFxuICAgIH0pLFxuICB9XG59XG4iXX0=