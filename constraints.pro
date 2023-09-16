% Yarn Constraints https://yarnpkg.com/features/constraints
% check with "yarn constraints" (fix w/ "yarn constraints --fix")
% reference for other constraints: https://github.com/babel/babel/blob/main/constraints.pro

% Enforces that a dependency doesn't appear in both `dependencies` and `devDependencies`
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, null, 'devDependencies') :-
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'devDependencies'),
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'dependencies').

% Prevent two workspaces from depending on conflicting versions of a same dependency
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType) :-
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, DependencyRange, DependencyType),
  workspace_has_dependency(OtherWorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType2),
  DependencyRange \= DependencyRange2.

% Enforce that all workspaces building with Babel depend on '@babel/runtime-corejs3' and 'core-js'.
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, DependencyRange, 'dependencies') :-
  member(DependencyIdent, [
    '@babel/runtime-corejs3',
    'core-js'
  ]),
  % Exclude the root workspace
  WorkspaceCwd \= '.',
  % Only target workspaces with a build:js script
  workspace_field(WorkspaceCwd, 'scripts.build:js', _),
  % Get the range from the root workspace
  workspace_has_dependency('.', DependencyIdent, DependencyRange, _).
