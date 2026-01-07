{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    nodejs
    nodePackages.pnpm
    openssl
    prisma-engines          # <-- provide engine files (libraries)
  ];

  shellHook = ''
    export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
    export PRISMA_QUERY_ENGINE_BINARY="${pkgs.prisma-engines}/bin/query-engine"
    export PRISMA_QUERY_ENGINE_LIBRARY="${pkgs.prisma-engines}/lib/libquery_engine.node"
    export PRISMA_SCHEMA_ENGINE_LIBRARY="${pkgs.prisma-engines}/lib/libschema_engine.node"
    export PRISMA_FMT_BINARY="${pkgs.prisma-engines}/bin/prisma-fmt"

    # Note: We set checking to 1 to allow it to run even if valid,
    # but the versions MUST match for this to work.
    export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
  '';
}
